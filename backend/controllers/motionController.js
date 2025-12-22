import Motion from "../models/motionModel.js";
import Tournament from "../models/tournamentModel.js";

// Create a motion for a tournament
export const createMotion = async (req, res) => {
	try {
		const { tournamentId } = req.params;
		const { round, roundType, motionText, infoSlide, prepTime, scheduledReleaseTime } = req.body;
		const userId = req.user._id;

		// Check if tournament exists
		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		// Check if user is the tournament creator
		if (tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only the tournament creator can add motions" });
		}

		// Check if motion already exists for this round
		const existingMotion = await Motion.findOne({ 
			tournament: tournamentId, 
			round,
			roundType: roundType || "preliminary"
		});
		if (existingMotion) {
			return res.status(400).json({ error: "Motion already exists for this round" });
		}

		const motion = new Motion({
			tournament: tournamentId,
			round,
			roundType: roundType || "preliminary",
			motionText,
			infoSlide: infoSlide || "",
			prepTime: prepTime || (tournament.format === "AP" ? 30 : 15),
			scheduledReleaseTime: scheduledReleaseTime || null,
			createdBy: userId,
		});

		await motion.save();

		res.status(201).json(motion);
	} catch (error) {
		console.error("Error in createMotion:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// Get all motions for a tournament (organizer view)
export const getTournamentMotions = async (req, res) => {
	try {
		const { tournamentId } = req.params;
		const userId = req.user._id;

		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		// Creators see all motions, others see only released
		const isOrganizer = tournament.creator.toString() === userId.toString();
		
		let query = { tournament: tournamentId };
		if (!isOrganizer) {
			query.isReleased = true;
		}

		const motions = await Motion.find(query)
			.sort({ roundType: 1, round: 1 })
			.populate("createdBy", "username name profilePic");

		res.status(200).json(motions);
	} catch (error) {
		console.error("Error in getTournamentMotions:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// Get released motions for a tournament (participant view)
export const getReleasedMotions = async (req, res) => {
	try {
		const { tournamentId } = req.params;

		const motions = await Motion.find({ 
			tournament: tournamentId, 
			isReleased: true 
		})
			.sort({ roundType: 1, round: 1 })
			.select("-scheduledReleaseTime");

		res.status(200).json(motions);
	} catch (error) {
		console.error("Error in getReleasedMotions:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// Update a motion
export const updateMotion = async (req, res) => {
	try {
		const { motionId } = req.params;
		const { motionText, infoSlide, prepTime, scheduledReleaseTime } = req.body;
		const userId = req.user._id;

		const motion = await Motion.findById(motionId).populate("tournament");
		if (!motion) {
			return res.status(404).json({ error: "Motion not found" });
		}

		// Check if user is the tournament creator
		if (motion.tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only the tournament creator can update motions" });
		}

		// Don't allow updating released motions (except scheduling)
		if (motion.isReleased && (motionText || infoSlide)) {
			return res.status(400).json({ error: "Cannot modify a released motion" });
		}

		if (motionText) motion.motionText = motionText;
		if (infoSlide !== undefined) motion.infoSlide = infoSlide;
		if (prepTime) motion.prepTime = prepTime;
		if (scheduledReleaseTime !== undefined) motion.scheduledReleaseTime = scheduledReleaseTime;

		await motion.save();

		res.status(200).json(motion);
	} catch (error) {
		console.error("Error in updateMotion:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// Release a motion immediately
export const releaseMotion = async (req, res) => {
	try {
		const { motionId } = req.params;
		const userId = req.user._id;

		const motion = await Motion.findById(motionId).populate("tournament");
		if (!motion) {
			return res.status(404).json({ error: "Motion not found" });
		}

		// Check if user is the tournament creator
		if (motion.tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only the tournament creator can release motions" });
		}

		if (motion.isReleased) {
			return res.status(400).json({ error: "Motion is already released" });
		}

		motion.isReleased = true;
		motion.releaseTime = new Date();
		motion.scheduledReleaseTime = null;

		await motion.save();

		res.status(200).json(motion);
	} catch (error) {
		console.error("Error in releaseMotion:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// Schedule motion release
export const scheduleMotionRelease = async (req, res) => {
	try {
		const { motionId } = req.params;
		const { scheduledReleaseTime } = req.body;
		const userId = req.user._id;

		const motion = await Motion.findById(motionId).populate("tournament");
		if (!motion) {
			return res.status(404).json({ error: "Motion not found" });
		}

		// Check if user is the tournament creator
		if (motion.tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only the tournament creator can schedule motion release" });
		}

		if (motion.isReleased) {
			return res.status(400).json({ error: "Motion is already released" });
		}

		if (!scheduledReleaseTime) {
			return res.status(400).json({ error: "Scheduled release time is required" });
		}

		const releaseDate = new Date(scheduledReleaseTime);
		if (releaseDate <= new Date()) {
			return res.status(400).json({ error: "Scheduled time must be in the future" });
		}

		motion.scheduledReleaseTime = releaseDate;
		await motion.save();

		res.status(200).json(motion);
	} catch (error) {
		console.error("Error in scheduleMotionRelease:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// Delete a motion
export const deleteMotion = async (req, res) => {
	try {
		const { motionId } = req.params;
		const userId = req.user._id;

		const motion = await Motion.findById(motionId).populate("tournament");
		if (!motion) {
			return res.status(404).json({ error: "Motion not found" });
		}

		// Check if user is the tournament creator
		if (motion.tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only the tournament creator can delete motions" });
		}

		// Don't allow deleting released motions
		if (motion.isReleased) {
			return res.status(400).json({ error: "Cannot delete a released motion" });
		}

		await Motion.findByIdAndDelete(motionId);

		res.status(200).json({ message: "Motion deleted successfully" });
	} catch (error) {
		console.error("Error in deleteMotion:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// Archive a motion (after tournament ends)
export const archiveMotion = async (req, res) => {
	try {
		const { motionId } = req.params;
		const userId = req.user._id;

		const motion = await Motion.findById(motionId).populate("tournament");
		if (!motion) {
			return res.status(404).json({ error: "Motion not found" });
		}

		// Check if user is the tournament creator
		if (motion.tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only the tournament creator can archive motions" });
		}

		motion.isArchived = true;
		motion.archivedAt = new Date();
		await motion.save();

		res.status(200).json(motion);
	} catch (error) {
		console.error("Error in archiveMotion:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// Get archived motions (public archive for learning)
export const getArchivedMotions = async (req, res) => {
	try {
		const { page = 1, limit = 20, format, category } = req.query;

		let pipeline = [
			{ $match: { isArchived: true } },
			{
				$lookup: {
					from: "tournaments",
					localField: "tournament",
					foreignField: "_id",
					as: "tournamentData",
				},
			},
			{ $unwind: "$tournamentData" },
		];

		// Filter by format if provided
		if (format) {
			pipeline.push({ $match: { "tournamentData.format": format } });
		}

		// Filter by category if provided
		if (category) {
			pipeline.push({ $match: { "tournamentData.category": category } });
		}

		pipeline.push(
			{ $sort: { archivedAt: -1 } },
			{ $skip: (parseInt(page) - 1) * parseInt(limit) },
			{ $limit: parseInt(limit) },
			{
				$project: {
					motionText: 1,
					infoSlide: 1,
					round: 1,
					roundType: 1,
					archivedAt: 1,
					tournamentName: "$tournamentData.name",
					tournamentFormat: "$tournamentData.format",
					tournamentCategory: "$tournamentData.category",
				},
			}
		);

		const motions = await Motion.aggregate(pipeline);

		// Get total count for pagination
		const totalCount = await Motion.countDocuments({ isArchived: true });

		res.status(200).json({
			motions,
			totalPages: Math.ceil(totalCount / parseInt(limit)),
			currentPage: parseInt(page),
			totalCount,
		});
	} catch (error) {
		console.error("Error in getArchivedMotions:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// Check and release scheduled motions (called by cron job or timer)
export const checkScheduledReleases = async (req, res) => {
	try {
		const now = new Date();

		const motionsToRelease = await Motion.find({
			isReleased: false,
			scheduledReleaseTime: { $lte: now, $ne: null },
		});

		for (const motion of motionsToRelease) {
			motion.isReleased = true;
			motion.releaseTime = now;
			await motion.save();
		}

		res.status(200).json({
			message: `Released ${motionsToRelease.length} motions`,
			released: motionsToRelease.length,
		});
	} catch (error) {
		console.error("Error in checkScheduledReleases:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// Get motions for a specific round
export const getMotionsByRound = async (req, res) => {
	try {
		const { tournamentId, roundNumber } = req.params;
		const userId = req.user?._id;

		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		// Check if user is organizer
		const isOrganizer = userId && tournament.creator.toString() === userId.toString();

		let query = { 
			tournament: tournamentId, 
			round: parseInt(roundNumber) 
		};

		// Non-organizers can only see released motions
		if (!isOrganizer) {
			query.isReleased = true;
		}

		const motions = await Motion.find(query)
			.populate("createdBy", "username name");

		res.status(200).json(motions);
	} catch (error) {
		console.error("Error in getMotionsByRound:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// Update break threshold for tournament
export const updateBreakThreshold = async (req, res) => {
	try {
		const { tournamentId } = req.params;
		const { breakingTeams } = req.body;
		const userId = req.user._id;

		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		// Check if user is the tournament creator
		if (tournament.creator.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only the tournament creator can update break threshold" });
		}

		if (!breakingTeams || breakingTeams < 2) {
			return res.status(400).json({ error: "Breaking teams must be at least 2" });
		}

		tournament.breakingTeams = breakingTeams;
		await tournament.save();

		res.status(200).json(tournament);
	} catch (error) {
		console.error("Error in updateBreakThreshold:", error.message);
		res.status(500).json({ error: error.message });
	}
};
