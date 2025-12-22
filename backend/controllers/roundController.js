import Round from "../models/roundModel.js";
import Tournament from "../models/tournamentModel.js";
import DebateRoom from "../models/debateRoomModel.js";
import { generateDraw, canGenerateDraw } from "../utils/drawGenerator.js";

// Get rounds for a tournament
const getRounds = async (req, res) => {
	try {
		const { tournamentId } = req.params;

		const rounds = await Round.find({ tournament: tournamentId })
			.populate("motion")
			.sort({ roundNumber: 1 });

		res.status(200).json(rounds);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getRounds: ", error.message);
	}
};

// Get single round
const getRound = async (req, res) => {
	try {
		const { roundId } = req.params;

		const round = await Round.findById(roundId)
			.populate("motion")
			.populate("tournament", "name format");

		if (!round) {
			return res.status(404).json({ error: "Round not found" });
		}

		res.status(200).json(round);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getRound: ", error.message);
	}
};

// Update round details
const updateRound = async (req, res) => {
	try {
		const { roundId } = req.params;
		const userId = req.user._id;

		const round = await Round.findById(roundId).populate("tournament");

		if (!round) {
			return res.status(404).json({ error: "Round not found" });
		}

		// Check if user is tournament creator
		if (round.tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only tournament creator can update rounds" });
		}

		const {
			roundType,
			status,
			startTime,
			prepEndTime,
			submissionDeadline,
		} = req.body;

		// Update fields if provided
		if (roundType) round.roundType = roundType;
		if (status) round.status = status;
		if (startTime) round.startTime = startTime;
		if (prepEndTime) round.prepEndTime = prepEndTime;
		if (submissionDeadline) round.submissionDeadline = submissionDeadline;

		await round.save();

		res.status(200).json(round);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in updateRound: ", error.message);
	}
};

// Generate draw for a round
const generateRoundDraw = async (req, res) => {
	try {
		const { tournamentId, roundNumber } = req.params;
		const userId = req.user._id;

		const tournament = await Tournament.findById(tournamentId);

		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		// Check if user is tournament creator
		if (tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only tournament creator can generate draw" });
		}

		// Check if draw can be generated
		const check = await canGenerateDraw(tournamentId, roundNumber);
		if (!check.canGenerate) {
			return res.status(400).json({ error: check.reason });
		}

		// Generate draw
		const debates = await generateDraw(tournamentId, parseInt(roundNumber));

		// Populate debate details
		const populatedDebates = await DebateRoom.find({
			_id: { $in: debates.map(d => d._id) }
		})
			.populate("teams.team", "name institution")
			.populate("judges", "name username")
			.populate("chair", "name username");

		res.status(200).json({
			message: "Draw generated successfully",
			debates: populatedDebates,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in generateRoundDraw: ", error.message);
	}
};

// Get draw for a round
const getRoundDraw = async (req, res) => {
	try {
		const { tournamentId, roundNumber } = req.params;

		const round = await Round.findOne({
			tournament: tournamentId,
			roundNumber: parseInt(roundNumber),
		});

		if (!round) {
			return res.status(404).json({ error: "Round not found" });
		}

		if (!round.isDrawReleased) {
			return res.status(400).json({ error: "Draw not yet released" });
		}

		const debates = await DebateRoom.find({ round: round._id })
			.populate("teams.team", "name institution")
			.populate("judges", "name username institution")
			.populate("chair", "name username");

		res.status(200).json(debates);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getRoundDraw: ", error.message);
	}
};

// Update round status
const updateRoundStatus = async (req, res) => {
	try {
		const { roundId } = req.params;
		const { status } = req.body;
		const userId = req.user._id;

		const round = await Round.findById(roundId).populate("tournament");

		if (!round) {
			return res.status(404).json({ error: "Round not found" });
		}

		// Check if user is tournament creator
		if (round.tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only tournament creator can update status" });
		}

		const validStatuses = ["scheduled", "in-progress", "completed", "cancelled"];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({ error: "Invalid status" });
		}

		round.status = status;
		await round.save();

		res.status(200).json(round);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in updateRoundStatus: ", error.message);
	}
};

export {
	getRounds,
	getRound,
	updateRound,
	generateRoundDraw,
	getRoundDraw,
	updateRoundStatus,
};
