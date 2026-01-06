import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import {
	createBallot,
	updateBallot,
	submitBallot,
	getMyBallots,
	getDebateBallots,
	getBallot,
	getBallotStatus,
} from "../controllers/ballotController.js";

const router = express.Router();

// Create or get ballot for a debate
router.post("/:debateId/create", protectRoute, createBallot);

// Update ballot (save draft)
router.put("/:id", protectRoute, updateBallot);

// Submit final ballot
router.post("/:id/submit", protectRoute, submitBallot);

// Get judge's own ballots
router.get("/my", protectRoute, getMyBallots);

// Get all ballots for a debate (TD only)
router.get("/debate/:debateId", protectRoute, getDebateBallots);

// Get ballot submission status for a debate
router.get("/debate/:debateId/status", protectRoute, getBallotStatus);

// Get single ballot by ID
router.get("/:id", protectRoute, getBallot);

export default router;
