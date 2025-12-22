import DebateRoom from "../models/debateRoomModel.js";
import Round from "../models/roundModel.js";
import Team from "../models/teamModel.js";
import User from "../models/userModel.js";

// Get debate room details
const getDebateRoom = async (req, res) => {
	try {
		const { debateId } = req.params;

		const debate = await DebateRoom.findById(debateId)
			.populate("tournament", "name format")
			.populate("round", "roundNumber motion")
			.populate("teams.team", "name institution members")
			.populate("teams.speakerScores.speaker", "name username")
			.populate("judges", "name username institution")
			.populate("chair", "name username")
			.populate("resultsEnteredBy", "name username");

		if (!debate) {
			return res.status(404).json({ error: "Debate room not found" });
		}

		res.status(200).json(debate);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getDebateRoom: ", error.message);
	}
};

// Submit debate for a team
const submitDebate = async (req, res) => {
	try {
		const { debateId } = req.params;
		const { teamId, submissionText } = req.body;
		const userId = req.user._id;

		const debate = await DebateRoom.findById(debateId)
			.populate("tournament")
			.populate("round");

		if (!debate) {
			return res.status(404).json({ error: "Debate room not found" });
		}

		// Check deadline
		if (debate.round.submissionDeadline && new Date() > debate.round.submissionDeadline) {
			return res.status(400).json({ error: "Submission deadline has passed" });
		}

		// Find team in debate
		const teamIndex = debate.teams.findIndex(
			t => t.team.toString() === teamId.toString()
		);

		if (teamIndex === -1) {
			return res.status(404).json({ error: "Team not found in this debate" });
		}

		// Verify user is a member of the team
		const team = await Team.findById(teamId);
		const isMember = team.members.some(
			member => member.toString() === userId.toString()
		);

		if (!isMember) {
			return res.status(403).json({ error: "You are not a member of this team" });
		}

		// Update submission
		debate.teams[teamIndex].hasSubmitted = true;
		debate.teams[teamIndex].submittedAt = new Date();
		debate.teams[teamIndex].submissionText = submissionText;

		// Check if all teams have submitted
		const allSubmitted = debate.teams.every(t => t.hasSubmitted);
		if (allSubmitted) {
			debate.status = "submitted";
		}

		await debate.save();

		res.status(200).json({
			message: "Debate submitted successfully",
			debate,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in submitDebate: ", error.message);
	}
};

// Enter results for a debate (judge only)
const enterResults = async (req, res) => {
	try {
		const { debateId } = req.params;
		const { results, feedback } = req.body;
		const userId = req.user._id;

		const debate = await DebateRoom.findById(debateId)
			.populate("tournament");

		if (!debate) {
			return res.status(404).json({ error: "Debate room not found" });
		}

		// Check if user is a judge for this debate or tournament creator
		const isJudge = debate.judges.some(j => j.toString() === userId.toString());
		const isCreator = debate.tournament.creator.toString() === userId.toString();

		if (!isJudge && !isCreator) {
			return res.status(403).json({ 
				error: "Only assigned judges or tournament creator can enter results" 
			});
		}

		// Validate results format
		// results should be array: [{ teamId, rank, points, speakerScores: [{ speakerId, score }] }]
		if (!Array.isArray(results) || results.length !== debate.teams.length) {
			return res.status(400).json({ 
				error: "Invalid results format. Must provide results for all teams." 
			});
		}

		// Update team results
		for (const result of results) {
			const teamIndex = debate.teams.findIndex(
				t => t.team.toString() === result.teamId.toString()
			);

			if (teamIndex !== -1) {
				debate.teams[teamIndex].rank = result.rank;
				debate.teams[teamIndex].points = result.points;
				debate.teams[teamIndex].speakerScores = result.speakerScores;
				
				// Calculate total speaks for team
				const totalSpeaks = result.speakerScores.reduce(
					(sum, s) => sum + s.score, 0
				);
				debate.teams[teamIndex].totalSpeaks = totalSpeaks;

				// Update team's overall statistics
				await Team.findByIdAndUpdate(result.teamId, {
					$inc: {
						totalPoints: result.points,
						totalSpeaks: totalSpeaks,
					}
				});
			}
		}

		debate.hasResults = true;
		debate.ballotSubmitted = true;
		debate.resultsEnteredBy = userId;
		debate.resultsEnteredAt = new Date();
		debate.feedback = feedback || "";
		debate.status = "completed";

		await debate.save();

		// Update round completion count
		const round = await Round.findById(debate.round);
		const completedDebates = await DebateRoom.countDocuments({
			round: debate.round,
			status: "completed",
		});
		round.completedDebates = completedDebates;
		await round.save();

		res.status(200).json({
			message: "Results entered successfully",
			debate,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in enterResults: ", error.message);
	}
};

// Get debates for a team
const getTeamDebates = async (req, res) => {
	try {
		const { teamId } = req.params;

		const debates = await DebateRoom.find({ "teams.team": teamId })
			.populate("tournament", "name format")
			.populate("round", "roundNumber motion")
			.populate("judges", "name username")
			.populate("chair", "name username")
			.sort({ createdAt: -1 });

		res.status(200).json(debates);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getTeamDebates: ", error.message);
	}
};

// Get debates a judge is assigned to
const getJudgeDebates = async (req, res) => {
	try {
		const userId = req.user._id;
		const { tournamentId } = req.query;

		let filter = { judges: userId };
		if (tournamentId) {
			filter.tournament = tournamentId;
		}

		const debates = await DebateRoom.find(filter)
			.populate("tournament", "name format")
			.populate("round", "roundNumber motion")
			.populate("teams.team", "name institution")
			.sort({ createdAt: -1 });

		res.status(200).json(debates);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getJudgeDebates: ", error.message);
	}
};

// Update debate room status
const updateDebateStatus = async (req, res) => {
	try {
		const { debateId } = req.params;
		const { status } = req.body;
		const userId = req.user._id;

		const debate = await DebateRoom.findById(debateId)
			.populate("tournament");

		if (!debate) {
			return res.status(404).json({ error: "Debate room not found" });
		}

		// Check if user is tournament creator
		if (debate.tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ 
				error: "Only tournament creator can update debate status" 
			});
		}

		const validStatuses = ["scheduled", "prep", "in-progress", "submitted", "judging", "completed"];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({ error: "Invalid status" });
		}

		debate.status = status;
		await debate.save();

		res.status(200).json(debate);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in updateDebateStatus: ", error.message);
	}
};

export {
	getDebateRoom,
	submitDebate,
	enterResults,
	getTeamDebates,
	getJudgeDebates,
	updateDebateStatus,
};
