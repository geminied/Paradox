import Tournament from "../models/tournamentModel.js";
import User from "../models/userModel.js";

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

		// Populate creator info
		await newTournament.populate("creator", "name username");

		res.status(201).json(newTournament);
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

		tournament.status = status;
		await tournament.save();
		await tournament.populate("creator", "name username");

		res.status(200).json(tournament);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in updateTournamentStatus: ", error.message);
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
};
