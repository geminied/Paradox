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
			.populate({
				path: "round",
				select: "roundNumber motion",
				populate: {
					path: "motion",
					select: "motionText infoSlide prepTime isReleased"
				}
			})
			.populate({
				path: "teams.team",
				select: "name institution members",
				populate: {
					path: "members",
					select: "name username"
				}
			})
			.populate("teams.speakerScores.speaker", "name username")
			.populate("judges", "name username institution")
			.populate("chair", "name username")
			.populate("currentSpeaker", "name username")
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
			.populate({
				path: "round",
				select: "roundNumber motion",
				populate: {
					path: "motion",
					select: "motionText infoSlide prepTime isReleased"
				}
			})
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
			.populate({
				path: "round",
				select: "roundNumber motion",
				populate: {
					path: "motion",
					select: "motionText infoSlide prepTime isReleased"
				}
			})
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

// Start prep time for debate
const startPrep = async (req, res) => {
	try {
		const { debateId } = req.params;
		const userId = req.user._id;

		const debate = await DebateRoom.findById(debateId)
			.populate("tournament");

		if (!debate) {
			return res.status(404).json({ error: "Debate room not found" });
		}

		// Check if user is tournament creator or judge
		const isCreator = debate.tournament.creator.toString() === userId.toString();
		const isJudge = debate.judges.some(j => j.toString() === userId.toString()) || 
					   (debate.chair && debate.chair.toString() === userId.toString());

		if (!isCreator && !isJudge) {
			return res.status(403).json({ error: "Only tournament creator or assigned judges can start prep" });
		}

		if (debate.status !== "scheduled") {
			return res.status(400).json({ error: "Debate has already started" });
		}

		// Start prep time
		debate.status = "prep";
		debate.prepStartTime = new Date();
		
		// Calculate total speeches based on format
		const format = debate.tournament.format;
		debate.totalSpeeches = format === "BP" ? 8 : 6; // BP: 8 speeches, AP: 6 speeches
		
		await debate.save();

		res.status(200).json(debate);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in startPrep: ", error.message);
	}
};

	// Start debate (after prep)
const startDebate = async (req, res) => {
	try {
		const { debateId } = req.params;
		const userId = req.user._id;

		const debate = await DebateRoom.findById(debateId)
			.populate("tournament")
			.populate({
				path: "teams.team",
				populate: { path: "members" }
			});

		if (!debate) {
			return res.status(404).json({ error: "Debate room not found" });
		}

		// Check if user is tournament creator or judge
		const isCreator = debate.tournament.creator.toString() === userId.toString();
		const isJudge = debate.judges.some(j => j.toString() === userId.toString()) || 
					   (debate.chair && debate.chair.toString() === userId.toString());

		if (!isCreator && !isJudge) {
			return res.status(403).json({ error: "Only tournament creator or assigned judges can start debate" });
		}

		if (debate.status !== "prep") {
			return res.status(400).json({ error: "Prep time must be started first" });
		}

		// Start debate
		debate.status = "in-progress";
		debate.debateStartTime = new Date();
		debate.currentSpeechNumber = 1;
		
		// Set first speaker based on format
		if (debate.teams.length > 0) {
			const firstTeam = debate.teams.find(t => 
				t.position === "OG" || t.position === "Proposition"
			);
			if (firstTeam && firstTeam.team.members && firstTeam.team.members.length > 0) {
				debate.currentSpeaker = firstTeam.team.members[0]._id;
			}
		}
		
		// Set speech deadline (speechDuration is in minutes, convert to milliseconds)
		const deadline = new Date();
		deadline.setTime(deadline.getTime() + debate.speechDuration * 60000);
		debate.speechDeadline = deadline;
		
		await debate.save();

		// Populate before sending
		const populatedDebate = await DebateRoom.findById(debate._id)
			.populate("tournament", "name format")
			.populate("round", "roundNumber motion")
			.populate({
				path: "teams.team",
				select: "name institution members",
				populate: { path: "members", select: "name username" }
			})
			.populate("judges", "name username institution")
			.populate("chair", "name username")
			.populate("currentSpeaker", "name username");

		res.status(200).json(populatedDebate);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in startDebate: ", error.message);
	}
};

// Advance to next speaker
const advanceTurn = async (req, res) => {
	try {
		const { debateId } = req.params;
		const userId = req.user._id;

		const debate = await DebateRoom.findById(debateId)
			.populate("tournament")
			.populate({
				path: "teams.team",
				populate: { path: "members" }
			});

		if (!debate) {
			return res.status(404).json({ error: "Debate room not found" });
		}

		// Check if user is tournament creator or judge
		const isCreator = debate.tournament.creator.toString() === userId.toString();
		const isJudge = debate.judges.some(j => j.toString() === userId.toString()) || 
					   (debate.chair && debate.chair.toString() === userId.toString());

		if (!isCreator && !isJudge) {
			return res.status(403).json({ error: "Only tournament creator or assigned judges can advance turn" });
		}

		if (debate.status !== "in-progress") {
			return res.status(400).json({ error: "Debate is not in progress" });
		}

		// Move to next speech
		debate.currentSpeechNumber += 1;
		
		// Check if debate is complete
		if (debate.currentSpeechNumber > debate.totalSpeeches) {
			debate.status = "submitted";
			debate.currentSpeaker = null;
			debate.speechDeadline = null;
		} else {
			// Set new deadline (speechDuration is in minutes, convert to milliseconds)
			const deadline = new Date();
			deadline.setTime(deadline.getTime() + debate.speechDuration * 60000);
			debate.speechDeadline = deadline;
			
			// Determine next speaker based on speech order
			const format = debate.tournament.format;
			const speechNum = debate.currentSpeechNumber;
			let nextSpeaker = null;

			if (format === "AP") {
				// AP Format: PM, LO, DPM, DLO, GW, OW (Prop1, Opp1, Prop2, Opp2, Prop3, Opp3)
				const propTeam = debate.teams.find(t => t.position === "Proposition");
				const oppTeam = debate.teams.find(t => t.position === "Opposition");
				
				if (speechNum === 1 && propTeam) nextSpeaker = propTeam.team.members[0]; // PM
				else if (speechNum === 2 && oppTeam) nextSpeaker = oppTeam.team.members[0]; // LO
				else if (speechNum === 3 && propTeam) nextSpeaker = propTeam.team.members[1]; // DPM
				else if (speechNum === 4 && oppTeam) nextSpeaker = oppTeam.team.members[1]; // DLO
				else if (speechNum === 5 && propTeam) nextSpeaker = propTeam.team.members[2]; // GW
				else if (speechNum === 6 && oppTeam) nextSpeaker = oppTeam.team.members[2]; // OW
			} else {
				// BP Format: OG1, OO1, CG1, CO1, OG2, OO2, CG2, CO2
				const ogTeam = debate.teams.find(t => t.position === "OG");
				const ooTeam = debate.teams.find(t => t.position === "OO");
				const cgTeam = debate.teams.find(t => t.position === "CG");
				const coTeam = debate.teams.find(t => t.position === "CO");
				
				if (speechNum === 1 && ogTeam) nextSpeaker = ogTeam.team.members[0];
				else if (speechNum === 2 && ooTeam) nextSpeaker = ooTeam.team.members[0];
				else if (speechNum === 3 && cgTeam) nextSpeaker = cgTeam.team.members[0];
				else if (speechNum === 4 && coTeam) nextSpeaker = coTeam.team.members[0];
				else if (speechNum === 5 && ogTeam) nextSpeaker = ogTeam.team.members[1];
				else if (speechNum === 6 && ooTeam) nextSpeaker = ooTeam.team.members[1];
				else if (speechNum === 7 && cgTeam) nextSpeaker = cgTeam.team.members[1];
				else if (speechNum === 8 && coTeam) nextSpeaker = coTeam.team.members[1];
			}
			
			debate.currentSpeaker = nextSpeaker ? nextSpeaker._id : null;
		}
		
		await debate.save();

		// Populate before sending
		const populatedDebate = await DebateRoom.findById(debate._id)
			.populate("tournament", "name format")
			.populate("round", "roundNumber motion")
			.populate({
				path: "teams.team",
				select: "name institution members",
				populate: { path: "members", select: "name username" }
			})
			.populate("judges", "name username institution")
			.populate("chair", "name username")
			.populate("currentSpeaker", "name username");

		res.status(200).json(populatedDebate);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in advanceTurn: ", error.message);
	}
};

// Complete debate (move to judging)
const completeDebate = async (req, res) => {
	try {
		const { debateId } = req.params;
		const userId = req.user._id;

		const debate = await DebateRoom.findById(debateId)
			.populate("tournament");

		if (!debate) {
			return res.status(404).json({ error: "Debate room not found" });
		}

		// Check if user is tournament creator or judge
		const isCreator = debate.tournament.creator.toString() === userId.toString();
		const isJudge = debate.judges.some(j => j.toString() === userId.toString()) || 
					   (debate.chair && debate.chair.toString() === userId.toString());

		if (!isCreator && !isJudge) {
			return res.status(403).json({ error: "Only tournament creator or assigned judges can complete debate" });
		}

		// Move to judging phase
		debate.status = "judging";
		await debate.save();

		res.status(200).json(debate);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in completeDebate: ", error.message);
	}
};

export {
	getDebateRoom,
	submitDebate,
	enterResults,
	getTeamDebates,
	getJudgeDebates,
	updateDebateStatus,
	startPrep,
	startDebate,
	advanceTurn,
	completeDebate,
};
