import Tournament from "../models/tournamentModel.js";
import User from "../models/userModel.js";
import Round from "../models/roundModel.js";
import DebateRoom from "../models/debateRoomModel.js";
import Motion from "../models/motionModel.js";
import Team from "../models/teamModel.js";
import mongoose from "mongoose";
import { generateCompleteDraw } from "../services/drawGenerator.js";
import applyTieBreakers from "../utils/tieBreakers.js";
import * as breakService from "../services/breakService.js";

// Create a new tournament
const createTournament = async (req, res) => {
	try {
		const {
			name,
			description,
			format,
			category,
			registrationDeadline,
			startDate,
			endDate,
			maxTeams,
			numberOfRounds,
			breakingTeams,
		} = req.body;
		const userId = req.user._id;

		// Validation
		if (!name || !format || !startDate || !endDate) {
			return res.status(400).json({ 
				error: "Name, format, start date, and end date are required" 
			});
		}

		if (!["BP", "AP"].includes(format)) {
			return res.status(400).json({ error: "Format must be BP or AP" });
		}

		if (new Date(startDate) > new Date(endDate)) {
			return res.status(400).json({ error: "Start date must be before end date" });
		}

		// Create tournament
		const newTournament = new Tournament({
			name,
			description: description || "",
			format,
			category: category || "open",
			creator: userId,
			registrationDeadline: registrationDeadline || startDate,
			startDate,
			endDate,
			maxTeams: maxTeams || 32,
			numberOfRounds: numberOfRounds || 5,
			breakingTeams: breakingTeams || 8,
			status: "draft",
		});

		await newTournament.save();

		// Automatically create rounds for the tournament
		const rounds = [];
		const totalRounds = numberOfRounds || 5;
		const breakTeams = breakingTeams || 8;
		
		// Calculate preliminary rounds
		// If breakingTeams = 8, we need QF, SF, Final = 3 break rounds
		// If breakingTeams = 4, we need SF, Final = 2 break rounds
		const breakRoundsNeeded = breakTeams >= 8 ? 3 : breakTeams >= 4 ? 2 : breakTeams >= 2 ? 1 : 0;
		const preliminaryRounds = totalRounds - breakRoundsNeeded;
		
		for (let i = 1; i <= totalRounds; i++) {
			let roundType = "preliminary";
			
			// Determine round type based on position
			if (i > preliminaryRounds) {
				const breakRoundIndex = i - preliminaryRounds;
				if (breakRoundsNeeded === 3) {
					// QF, SF, Final
					roundType = breakRoundIndex === 1 ? "break" : breakRoundIndex === 2 ? "semi" : "final";
				} else if (breakRoundsNeeded === 2) {
					// SF, Final
					roundType = breakRoundIndex === 1 ? "semi" : "final";
				} else if (breakRoundsNeeded === 1) {
					// Final only
					roundType = "final";
				}
			}
			
			const round = new Round({
				tournament: newTournament._id,
				roundNumber: i,
				roundType: roundType,
				status: "scheduled",
			});
			await round.save();
			rounds.push(round);
		}

		// Populate creator info
		await newTournament.populate("creator", "name username");

		res.status(201).json({
			tournament: newTournament,
			rounds: rounds,
			message: `Tournament created successfully with ${totalRounds} rounds`,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in createTournament: ", error.message);
	}
};

// Get all tournaments
const getTournaments = async (req, res) => {
	try {
		const { status, category, format } = req.query;
		
		let filter = {};
		if (status) filter.status = status;
		if (category) filter.category = category;
		if (format) filter.format = format;

		const tournaments = await Tournament.find(filter)
			.populate("creator", "name username")
			.sort({ createdAt: -1 });

		res.status(200).json(tournaments);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getTournaments: ", error.message);
	}
};

// Get single tournament
const getTournament = async (req, res) => {
	try {
		const tournament = await Tournament.findById(req.params.id)
			.populate("creator", "name username")
			.populate("judges", "name username")
			.populate("participants", "name username");

		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		res.status(200).json(tournament);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getTournament: ", error.message);
	}
};

// Update tournament
const updateTournament = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const tournament = await Tournament.findById(id);

		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		// Check if user is the creator
		if (tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only edit your own tournaments" });
		}

		// Don't allow editing completed or cancelled tournaments
		if (["completed", "cancelled"].includes(tournament.status)) {
			return res.status(400).json({ 
				error: "Cannot edit completed or cancelled tournaments" 
			});
		}

		const {
			name,
			description,
			format,
			category,
			status,
			registrationDeadline,
			startDate,
			endDate,
			maxTeams,
			numberOfRounds,
			breakingTeams,
		} = req.body;

		// Update fields if provided
		if (name) tournament.name = name;
		if (description !== undefined) tournament.description = description;
		if (format) tournament.format = format;
		if (category) tournament.category = category;
		if (status) tournament.status = status;
		if (registrationDeadline) tournament.registrationDeadline = registrationDeadline;
		if (startDate) tournament.startDate = startDate;
		if (endDate) tournament.endDate = endDate;
		if (maxTeams) tournament.maxTeams = maxTeams;
		if (numberOfRounds) tournament.numberOfRounds = numberOfRounds;
		if (breakingTeams) tournament.breakingTeams = breakingTeams;

		await tournament.save();
		await tournament.populate("creator", "name username");

		res.status(200).json(tournament);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in updateTournament: ", error.message);
	}
};

// Delete tournament
const deleteTournament = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const tournament = await Tournament.findById(id);

		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		// Check if user is the creator
		if (tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only delete your own tournaments" });
		}

		// Don't allow deleting ongoing tournaments
		if (tournament.status === "ongoing") {
			return res.status(400).json({ 
				error: "Cannot delete an ongoing tournament. Cancel it first." 
			});
		}

		await Tournament.findByIdAndDelete(id);

		res.status(200).json({ message: "Tournament deleted successfully" });
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in deleteTournament: ", error.message);
	}
};

// Get tournaments created by user
const getMyTournaments = async (req, res) => {
	try {
		const userId = req.user._id;

		const tournaments = await Tournament.find({ creator: userId })
			.populate("creator", "name username")
			.sort({ createdAt: -1 });

		res.status(200).json(tournaments);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getMyTournaments: ", error.message);
	}
};

// Get tournaments user is participating in
const getJoinedTournaments = async (req, res) => {
	try {
		const userId = req.user._id;

		const tournaments = await Tournament.find({ participants: userId })
			.populate("creator", "name username")
			.sort({ startDate: -1 });

		res.status(200).json(tournaments);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getJoinedTournaments: ", error.message);
	}
};

// Update tournament status
const updateTournamentStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;
		const userId = req.user._id;

		const tournament = await Tournament.findById(id);

		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		if (tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only the creator can update status" });
		}

		const validStatuses = ["draft", "registration", "ongoing", "completed", "cancelled"];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({ error: "Invalid status" });
		}

		// If changing to 'ongoing', validate that all rounds have motions
		if (status === "ongoing" && tournament.status !== "ongoing") {
			const rounds = await Round.find({ tournament: id });
			const roundsWithoutMotions = rounds.filter(round => !round.motion);
			
			if (roundsWithoutMotions.length > 0) {
				const roundNumbers = roundsWithoutMotions.map(r => r.roundNumber).join(", ");
				return res.status(400).json({
					error: `Cannot start tournament. The following rounds are missing motions: Round ${roundNumbers}. Please create motions for all rounds first.`
				});
			}
		}

		tournament.status = status;
		await tournament.save();
		await tournament.populate("creator", "name username");

		res.status(200).json(tournament);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in updateTournamentStatus: ", error.message);
	}
};

// Add judge to tournament pool
const addJudgeToTournament = async (req, res) => {
	try {
		const { tournamentId } = req.params;
		const { judgeId } = req.body;
		const userId = req.user._id;

		const tournament = await Tournament.findById(tournamentId);

		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		// Only tournament creator can add judges
		if (tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only tournament creator can add judges" });
		}

		// Check if judge exists
		const judge = await User.findById(judgeId);
		if (!judge) {
			return res.status(404).json({ error: "Judge not found" });
		}

		// Check if judge is already added
		if (tournament.judges.includes(judgeId)) {
			return res.status(400).json({ error: "Judge already added to this tournament" });
		}

		// Add judge to tournament pool
		tournament.judges.push(judgeId);
		await tournament.save();

		await tournament.populate("judges", "name username institution judgeProfile");

		res.status(200).json({ 
			message: "Judge added successfully", 
			judges: tournament.judges 
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in addJudgeToTournament: ", error.message);
	}
};

// Remove judge from tournament pool
const removeJudgeFromTournament = async (req, res) => {
	try {
		const { tournamentId, judgeId } = req.params;
		const userId = req.user._id;

		const tournament = await Tournament.findById(tournamentId);

		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		// Only tournament creator can remove judges
		if (tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only tournament creator can remove judges" });
		}

		// Check if judge is in the tournament
		if (!tournament.judges.includes(judgeId)) {
			return res.status(400).json({ error: "Judge not found in tournament pool" });
		}

		// Don't allow removing judges if tournament is ongoing
		if (tournament.status === "ongoing") {
			return res.status(400).json({ 
				error: "Cannot remove judges from ongoing tournament" 
			});
		}

		// Remove judge
		tournament.judges = tournament.judges.filter(
			id => id.toString() !== judgeId.toString()
		);
		await tournament.save();

		await tournament.populate("judges", "name username institution judgeProfile");

		res.status(200).json({ 
			message: "Judge removed successfully", 
			judges: tournament.judges 
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in removeJudgeFromTournament: ", error.message);
	}
};

// Get judges for a tournament
const getJudgesForTournament = async (req, res) => {
	try {
		const { tournamentId } = req.params;

		const tournament = await Tournament.findById(tournamentId)
			.populate("judges", "name username institution judgeProfile");

		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		res.status(200).json(tournament.judges);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getJudgesForTournament: ", error.message);
	}
};

// Get judge conflicts for a tournament
const getJudgeConflicts = async (req, res) => {
	try {
		const { tournamentId } = req.params;

		const tournament = await Tournament.findById(tournamentId)
			.populate("judges", "name username institution judgeProfile");

		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		// Get all teams in the tournament (we'll need Team model for this)
		// For now, return judges with their conflict institutions
		const judgeConflicts = tournament.judges.map(judge => ({
			judgeId: judge._id,
			judgeName: judge.name,
			judgeInstitution: judge.institution,
			conflictInstitutions: judge.judgeProfile?.conflictInstitutions || []
		}));

		res.status(200).json(judgeConflicts);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getJudgeConflicts: ", error.message);
	}
};

// Get rounds for a tournament
const getRounds = async (req, res) => {
	try {
		const { tournamentId } = req.params;

		const rounds = await Round.find({ tournament: tournamentId }).sort({ roundNumber: 1 });
		
		res.status(200).json(rounds);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getRounds: ", error.message);
	}
};

// Generate draw for a round
const generateDraw = async (req, res) => {
	try {
		const { roundId } = req.params;
		const userId = req.user._id;

		// Get round and tournament
		const round = await Round.findById(roundId);
		if (!round) {
			return res.status(404).json({ error: "Round not found" });
		}

		const tournament = await Tournament.findById(round.tournament);
		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		// Check if user is tournament creator
		if (tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only tournament creator can generate draw" });
		}

		// Check if round is in correct status
		if (round.status !== "scheduled") {
			return res.status(400).json({ error: "Can only generate draw for scheduled rounds" });
		}

		// Generate draw
		const rooms = await generateCompleteDraw(
			tournament._id,
			round._id,
			round.roundNumber,
			tournament.format
		);

		// Update round status
		round.status = "in-progress";
		await round.save();

		res.status(200).json({
			message: "Draw generated successfully",
			rooms,
			roundNumber: round.roundNumber
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in generateDraw: ", error.message);
	}
};

// Get draw for a round
const getDraw = async (req, res) => {
	try {
		const { roundId } = req.params;

		const rooms = await DebateRoom.find({ round: roundId })
			.populate("teams.team", "name institution captain members")
			.populate("judges", "name institution judgeProfile")
			.populate("chair", "name institution judgeProfile")
			.sort({ roomName: 1 });

		res.status(200).json(rooms);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getDraw: ", error.message);
	}
};

// Delete draw (regenerate)
const deleteDraw = async (req, res) => {
	try {
		const { roundId } = req.params;
		const userId = req.user._id;

		// Get round and tournament
		const round = await Round.findById(roundId);
		if (!round) {
			return res.status(404).json({ error: "Round not found" });
		}

		const tournament = await Tournament.findById(round.tournament);
		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		// Check if user is tournament creator
		if (tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only tournament creator can delete draw" });
		}

		// Delete all rooms for this round
		await DebateRoom.deleteMany({ round: roundId });

		// Reset round status
		round.status = "scheduled";
		await round.save();

		res.status(200).json({ message: "Draw deleted successfully" });
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in deleteDraw: ", error.message);
	}
};

// Get tournament standings with tie-breakers
const getStandings = async (req, res) => {
	try {
		const { tournamentId } = req.params;

		// Find all teams in tournament
		const teams = await Team.find({ tournament: tournamentId })
			.populate('members', 'name username profilePic')
			.populate('captain', 'name username')
			.sort({ totalPoints: -1, totalSpeaks: -1 });

		console.log(`[Standings] Found ${teams.length} teams for tournament ${tournamentId}`);
		console.log(`[Standings] Teams data:`, teams.map(t => ({ 
			name: t.name, 
			totalPoints: t.totalPoints, 
			totalSpeaks: t.totalSpeaks 
		})));

		// If no teams, return empty array (valid state before any rounds)
		if (!teams || teams.length === 0) {
			return res.status(200).json([]);
		}

		// Apply comprehensive tie-breaking
		const rankedTeams = await applyTieBreakers(teams, tournamentId);
		
		console.log(`[Standings] After tie-breaking:`, rankedTeams.map(t => ({ 
			rank: t.rank, 
			name: t.name, 
			totalPoints: t.totalPoints 
		})));

		res.status(200).json(rankedTeams);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getStandings: ", error.message);
	}
};

// Get speaker standings across tournament
const getSpeakerStandings = async (req, res) => {
	try {
		const { tournamentId } = req.params;

		// Aggregate speaker scores from all completed debates
		const speakerStats = await DebateRoom.aggregate([
			{
				$match: {
					tournament: new mongoose.Types.ObjectId(tournamentId),
					hasResults: true
				}
			},
			{ $unwind: "$teams" },
			{ $unwind: "$teams.speakerScores" },
			{
				$group: {
					_id: "$teams.speakerScores.speaker",
					totalScore: { $sum: "$teams.speakerScores.score" },
					numSpeeches: { $count: {} },
					teamId: { $first: "$teams.team" }
				}
			},
			{
				$addFields: {
					averageScore: { $divide: ["$totalScore", "$numSpeeches"] }
				}
			},
			{
				$lookup: {
					from: "users",
					localField: "_id",
					foreignField: "_id",
					as: "speakerInfo"
				}
			},
			{
				$lookup: {
					from: "teams",
					localField: "teamId",
					foreignField: "_id",
					as: "teamInfo"
				}
			},
			{ $unwind: "$speakerInfo" },
			{ $unwind: "$teamInfo" },
			{
				$project: {
					_id: 1,
					name: "$speakerInfo.name",
					username: "$speakerInfo.username",
					profilePic: "$speakerInfo.profilePic",
					team: {
						_id: "$teamInfo._id",
						name: "$teamInfo.name",
						institution: "$teamInfo.institution"
					},
					totalScore: 1,
					numSpeeches: 1,
					averageScore: 1
				}
			},
			{ $sort: { averageScore: -1, totalScore: -1 } }
		]);

		res.status(200).json(speakerStats);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getSpeakerStandings: ", error.message);
	}
};

// ==================== BREAK & ELIMINATION ROUNDS ====================

/**
 * Calculate and announce the break
 * POST /api/tournaments/:tournamentId/break/announce
 */
const announceBreak = async (req, res) => {
	try {
		const { tournamentId } = req.params;

		// Verify tournament exists and user is creator
		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		if (tournament.creator.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Only tournament creator can announce break" });
		}

		// Calculate break
		const breakData = await breakService.calculateBreak(tournamentId);

		res.status(200).json({
			message: "Break announced successfully",
			...breakData
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in announceBreak: ", error.message);
	}
};

/**
 * Generate quarterfinals draw
 * POST /api/tournaments/:tournamentId/break/quarterfinals
 */
const generateQuarterfinals = async (req, res) => {
	try {
		const { tournamentId } = req.params;

		// Verify tournament exists and user is creator
		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		if (tournament.creator.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Only tournament creator can generate quarterfinals" });
		}

		// Generate QF draw
		const qfData = await breakService.generateQuarterfinals(tournamentId);

		res.status(200).json({
			message: qfData.message,
			round: qfData.round,
			debates: qfData.debates
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in generateQuarterfinals: ", error.message);
	}
};

/**
 * Generate semifinals draw
 * POST /api/tournaments/:tournamentId/break/semifinals
 */
const generateSemifinals = async (req, res) => {
	try {
		const { tournamentId } = req.params;
		const { qfRoundId } = req.body;

		if (!qfRoundId) {
			return res.status(400).json({ error: "Quarterfinal round ID is required" });
		}

		// Verify tournament exists and user is creator
		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		if (tournament.creator.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Only tournament creator can generate semifinals" });
		}

		// Generate SF draw
		const sfData = await breakService.generateSemifinals(tournamentId, qfRoundId);

		res.status(200).json({
			message: sfData.message,
			round: sfData.round,
			debates: sfData.debates,
			advancingTeams: sfData.advancingTeams
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in generateSemifinals: ", error.message);
	}
};

/**
 * Generate grand final
 * POST /api/tournaments/:tournamentId/break/finals
 */
const generateGrandFinal = async (req, res) => {
	try {
		const { tournamentId } = req.params;
		const { sfRoundId } = req.body;

		if (!sfRoundId) {
			return res.status(400).json({ error: "Semifinal round ID is required" });
		}

		// Verify tournament exists and user is creator
		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		if (tournament.creator.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Only tournament creator can generate grand final" });
		}

		// Generate GF
		const gfData = await breakService.generateGrandFinal(tournamentId, sfRoundId);

		res.status(200).json({
			message: gfData.message,
			round: gfData.round,
			debate: gfData.debate,
			finalists: gfData.finalists
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in generateGrandFinal: ", error.message);
	}
};

/**
 * Get elimination bracket structure
 * GET /api/tournaments/:tournamentId/break/bracket
 */
const getEliminationBracket = async (req, res) => {
	try {
		const { tournamentId } = req.params;

		const bracket = await breakService.getEliminationBracket(tournamentId);

		res.status(200).json(bracket);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getEliminationBracket: ", error.message);
	}
};

/**
 * Complete tournament
 * POST /api/tournaments/:tournamentId/complete
 */
const completeTournamentController = async (req, res) => {
	try {
		const { tournamentId } = req.params;

		// Verify tournament exists and user is creator
		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		if (tournament.creator.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Only tournament creator can complete tournament" });
		}

		const result = await breakService.completeTournament(tournamentId);

		res.status(200).json({
			message: result.message,
			champion: result.champion
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in completeTournamentController: ", error.message);
	}
};

export {
	createTournament,
	getTournaments,
	getTournament,
	updateTournament,
	deleteTournament,
	getMyTournaments,
	getJoinedTournaments,
	updateTournamentStatus,
	addJudgeToTournament,
	removeJudgeFromTournament,
	getJudgesForTournament,
	getJudgeConflicts,
	getRounds,
	generateDraw,
	getDraw,
	deleteDraw,
	getStandings,
	getSpeakerStandings,
	announceBreak,
	generateQuarterfinals,
	generateSemifinals,
	generateGrandFinal,
	getEliminationBracket,
	completeTournamentController,
};
