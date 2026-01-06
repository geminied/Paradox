import Ballot from "../models/ballotModel.js";
import DebateRoom from "../models/debateRoomModel.js";
import Team from "../models/teamModel.js";
import Round from "../models/roundModel.js";

// Create or get ballot for a judge
const createBallot = async (req, res) => {
	try {
		const { debateId } = req.params;
		const userId = req.user._id;

		// Check if debate exists
		const debate = await DebateRoom.findById(debateId)
			.populate("tournament")
			.populate("teams.team");

		if (!debate) {
			return res.status(404).json({ error: "Debate not found" });
		}

		// Check if user is assigned as judge
		const isJudge = debate.judges.some(j => j.toString() === userId.toString()) || 
						debate.chair?.toString() === userId.toString();

		if (!isJudge) {
			return res.status(403).json({ 
				error: "Only assigned judges can create ballots for this debate" 
			});
		}

		// Check if ballot already exists
		let ballot = await Ballot.findOne({ debate: debateId, judge: userId });

		if (ballot) {
			// Return existing ballot
			ballot = await Ballot.findById(ballot._id)
				.populate("rankings.team", "name institution")
				.populate("speakerScores.speaker", "name")
				.populate("speakerScores.team", "name")
				.populate("teamFeedback.team", "name");
			return res.status(200).json(ballot);
		}

		// Create new ballot with empty structure
		ballot = new Ballot({
			debate: debateId,
			judge: userId,
			tournament: debate.tournament._id,
			isChairBallot: debate.chair?.toString() === userId.toString(),
		});

		await ballot.save();

		ballot = await Ballot.findById(ballot._id)
			.populate("rankings.team", "name institution")
			.populate("speakerScores.speaker", "name")
			.populate("speakerScores.team", "name")
			.populate("teamFeedback.team", "name");

		res.status(201).json(ballot);
	} catch (error) {
		// Handle duplicate key error - ballot already exists
		if (error.code === 11000) {
			try {
				// Fetch and return existing ballot
				let ballot = await Ballot.findOne({ debate: debateId, judge: userId })
					.populate("rankings.team", "name institution")
					.populate("speakerScores.speaker", "name")
					.populate("speakerScores.team", "name")
					.populate("teamFeedback.team", "name");
				return res.status(200).json(ballot);
			} catch (fetchError) {
				return res.status(500).json({ error: "Ballot exists but could not be fetched" });
			}
		}
		res.status(500).json({ error: error.message });
		console.log("Error in createBallot: ", error.message);
	}
};

// Update ballot (save draft)
const updateBallot = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;
		const { rankings, speakerScores, teamFeedback, overallFeedback } = req.body;

		const ballot = await Ballot.findById(id);

		if (!ballot) {
			return res.status(404).json({ error: "Ballot not found" });
		}

		// Check if user is the judge who owns this ballot
		if (ballot.judge.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only update your own ballot" });
		}

		// Check if ballot is already submitted
		if (ballot.status === "submitted") {
			return res.status(400).json({ error: "Cannot update submitted ballot" });
		}

		// Update fields
		if (rankings) ballot.rankings = rankings;
		if (speakerScores) ballot.speakerScores = speakerScores;
		if (teamFeedback) ballot.teamFeedback = teamFeedback;
		if (overallFeedback !== undefined) ballot.overallFeedback = overallFeedback;

		ballot.lastSavedAt = new Date();

		await ballot.save();

		const updatedBallot = await Ballot.findById(ballot._id)
			.populate("rankings.team", "name institution")
			.populate("speakerScores.speaker", "name")
			.populate("speakerScores.team", "name")
			.populate("teamFeedback.team", "name");

		res.status(200).json(updatedBallot);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in updateBallot: ", error.message);
	}
};

// Submit final ballot
const submitBallot = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const ballot = await Ballot.findById(id).populate("debate");

		if (!ballot) {
			return res.status(404).json({ error: "Ballot not found" });
		}

		// Check ownership
		if (ballot.judge.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only submit your own ballot" });
		}

		// Check if already submitted
		if (ballot.status === "submitted") {
			return res.status(400).json({ error: "Ballot already submitted" });
		}

		// Get debate details
		const debate = await DebateRoom.findById(ballot.debate._id).populate("teams.team");

		// Validation: Check all teams are ranked
		if (!ballot.rankings || ballot.rankings.length !== debate.teams.length) {
			return res.status(400).json({ 
				error: `Please rank all ${debate.teams.length} teams` 
			});
		}

		// Validation: Check all speakers have scores
		const totalSpeakers = debate.teams.reduce((sum, t) => sum + t.team.members.length, 0);
		if (!ballot.speakerScores || ballot.speakerScores.length !== totalSpeakers) {
			return res.status(400).json({ 
				error: `Please score all ${totalSpeakers} speakers` 
			});
		}

		// Validation: Check score ranges (70-80 for BP)
		for (const speakerScore of ballot.speakerScores) {
			if (speakerScore.score < 70 || speakerScore.score > 80) {
				return res.status(400).json({ 
					error: "Speaker scores must be between 70 and 80" 
				});
			}
		}

		// Validation: Check unique ranks
		const ranks = ballot.rankings.map(r => r.rank);
		const uniqueRanks = new Set(ranks);
		if (ranks.length !== uniqueRanks.size) {
			return res.status(400).json({ error: "Each team must have a unique rank" });
		}

		// Mark as submitted
		ballot.status = "submitted";
		ballot.submittedAt = new Date();
		await ballot.save();

		// Check if all judges have submitted
		const totalJudges = debate.judges.length;
		const submittedBallots = await Ballot.countDocuments({
			debate: debate._id,
			status: "submitted"
		});

		// If all ballots submitted, aggregate results
		if (submittedBallots === totalJudges) {
			await aggregateBallotsAndUpdateResults(debate._id);
		}

		const updatedBallot = await Ballot.findById(ballot._id)
			.populate("rankings.team", "name institution")
			.populate("speakerScores.speaker", "name")
			.populate("speakerScores.team", "name")
			.populate("teamFeedback.team", "name");

		res.status(200).json({
			message: "Ballot submitted successfully",
			ballot: updatedBallot,
			allBallotsSubmitted: submittedBallots === totalJudges,
			progress: `${submittedBallots}/${totalJudges}`
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in submitBallot: ", error.message);
	}
};

// Get judge's own ballots
const getMyBallots = async (req, res) => {
	try {
		const userId = req.user._id;
		const { tournamentId, status } = req.query;

		const filter = { judge: userId };
		if (tournamentId) filter.tournament = tournamentId;
		if (status) filter.status = status;

		const ballots = await Ballot.find(filter)
			.populate("debate", "roomName status")
			.populate("tournament", "name")
			.populate("rankings.team", "name institution")
			.sort({ createdAt: -1 });

		res.status(200).json(ballots);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getMyBallots: ", error.message);
	}
};

// Get all ballots for a debate (TD only)
const getDebateBallots = async (req, res) => {
	try {
		const { debateId } = req.params;
		const userId = req.user._id;

		const debate = await DebateRoom.findById(debateId).populate("tournament");

		if (!debate) {
			return res.status(404).json({ error: "Debate not found" });
		}

		// Check if user is tournament creator
		const isCreator = debate.tournament.creator.toString() === userId.toString();
		if (!isCreator) {
			return res.status(403).json({ 
				error: "Only tournament creator can view all ballots" 
			});
		}

		const ballots = await Ballot.find({ debate: debateId })
			.populate("judge", "name username")
			.populate("rankings.team", "name institution")
			.populate("speakerScores.speaker", "name")
			.populate("speakerScores.team", "name")
			.populate("teamFeedback.team", "name");

		res.status(200).json(ballots);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getDebateBallots: ", error.message);
	}
};

// Get single ballot
const getBallot = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const ballot = await Ballot.findById(id)
			.populate("debate")
			.populate("judge", "name username")
			.populate("tournament", "name")
			.populate("rankings.team", "name institution")
			.populate("speakerScores.speaker", "name")
			.populate("speakerScores.team", "name")
			.populate("teamFeedback.team", "name");

		if (!ballot) {
			return res.status(404).json({ error: "Ballot not found" });
		}

		// Check permissions: own ballot or tournament creator
		const debate = await DebateRoom.findById(ballot.debate._id).populate("tournament");
		const isOwner = ballot.judge._id.toString() === userId.toString();
		const isCreator = debate.tournament.creator.toString() === userId.toString();

		if (!isOwner && !isCreator) {
			return res.status(403).json({ error: "Access denied" });
		}

		res.status(200).json(ballot);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getBallot: ", error.message);
	}
};

// Get ballot submission status for a debate
const getBallotStatus = async (req, res) => {
	try {
		const { debateId } = req.params;

		const debate = await DebateRoom.findById(debateId);
		if (!debate) {
			return res.status(404).json({ error: "Debate not found" });
		}

		const totalJudges = debate.judges.length;
		const submittedCount = await Ballot.countDocuments({
			debate: debateId,
			status: "submitted"
		});

		const ballots = await Ballot.find({ debate: debateId })
			.populate("judge", "name username")
			.select("judge status submittedAt");

		res.status(200).json({
			totalJudges,
			submittedCount,
			remaining: totalJudges - submittedCount,
			progress: `${submittedCount}/${totalJudges}`,
			ballots,
			isComplete: submittedCount === totalJudges
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getBallotStatus: ", error.message);
	}
};

// Helper function: Aggregate ballots and update debate results
const aggregateBallotsAndUpdateResults = async (debateId) => {
	try {
		const ballots = await Ballot.find({ 
			debate: debateId, 
			status: "submitted" 
		}).populate("rankings.team").populate("speakerScores.speaker speakerScores.team");

		if (ballots.length === 0) return;

		const debate = await DebateRoom.findById(debateId).populate("teams.team");

		// Calculate average ranks for each team
		const teamRankings = {};
		ballots.forEach(ballot => {
			ballot.rankings.forEach(ranking => {
				const teamId = ranking.team._id.toString();
				if (!teamRankings[teamId]) {
					teamRankings[teamId] = [];
				}
				teamRankings[teamId].push(ranking.rank);
			});
		});

		// Calculate average rank
		const teamAverageRanks = {};
		for (const teamId in teamRankings) {
			const ranks = teamRankings[teamId];
			teamAverageRanks[teamId] = ranks.reduce((a, b) => a + b, 0) / ranks.length;
		}

		// Sort teams by average rank
		const sortedTeams = Object.entries(teamAverageRanks)
			.sort((a, b) => a[1] - b[1])
			.map(([teamId], index) => ({ teamId, finalRank: index + 1 }));

		// Assign points based on final rank (BP: 3, 2, 1, 0)
		const pointsMap = { 1: 3, 2: 2, 3: 1, 4: 0 };

		// Calculate average speaker scores
		const speakerAverages = {};
		ballots.forEach(ballot => {
			ballot.speakerScores.forEach(ss => {
				const speakerId = ss.speaker._id.toString();
				if (!speakerAverages[speakerId]) {
					speakerAverages[speakerId] = { scores: [], teamId: ss.team._id.toString() };
				}
				speakerAverages[speakerId].scores.push(ss.score);
			});
		});

		for (const speakerId in speakerAverages) {
			const scores = speakerAverages[speakerId].scores;
			speakerAverages[speakerId].avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
		}

		// Update debate results
		for (const { teamId, finalRank } of sortedTeams) {
			const teamIndex = debate.teams.findIndex(t => t.team._id.toString() === teamId);
			if (teamIndex !== -1) {
				debate.teams[teamIndex].rank = finalRank;
				debate.teams[teamIndex].points = pointsMap[finalRank] || 0;

				// Update speaker scores
				const teamSpeakers = Object.entries(speakerAverages)
					.filter(([_, data]) => data.teamId === teamId);

				debate.teams[teamIndex].speakerScores = teamSpeakers.map(([speakerId, data]) => ({
					speaker: speakerId,
					score: Math.round(data.avgScore * 10) / 10 // Round to 1 decimal
				}));

				const totalSpeaks = teamSpeakers.reduce((sum, [_, data]) => sum + data.avgScore, 0);
				debate.teams[teamIndex].totalSpeaks = Math.round(totalSpeaks * 10) / 10;

				// Update team's overall statistics
				const updateResult = await Team.findByIdAndUpdate(teamId, {
					$inc: {
						totalPoints: pointsMap[finalRank] || 0,
						totalSpeaks: totalSpeaks,
					}
				}, { new: true });
				
				console.log(`[Ballot Aggregation] Updated team ${updateResult.name}: +${pointsMap[finalRank]} points, +${totalSpeaks.toFixed(1)} speaks. New totals: ${updateResult.totalPoints} pts, ${updateResult.totalSpeaks} speaks`);
			}
		}

		debate.hasResults = true;
		debate.ballotSubmitted = true;
		debate.status = "completed";
		await debate.save();

		// Update round completion count
		const round = await Round.findById(debate.round);
		if (round) {
			const completedDebates = await DebateRoom.countDocuments({
				round: debate.round,
				status: "completed",
			});
			round.completedDebates = completedDebates;
			
			// If all debates in round are completed, mark round as completed
			if (completedDebates === round.totalDebates && round.totalDebates > 0) {
				round.status = "completed";
			}
			
			await round.save();
		}

		return true;
	} catch (error) {
		console.log("Error in aggregateBallotsAndUpdateResults: ", error.message);
		throw error;
	}
};

export { 
	createBallot, 
	updateBallot, 
	submitBallot, 
	getMyBallots, 
	getDebateBallots, 
	getBallot,
	getBallotStatus
};
