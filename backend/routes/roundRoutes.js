import express from "express";
import {
	getRounds,
	getRound,
	updateRound,
	generateRoundDraw,
	getRoundDraw,
	updateRoundStatus,
} from "../controllers/roundController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

// Get rounds for a tournament
router.get("/tournament/:tournamentId", getRounds);

// Get single round
router.get("/:roundId", getRound);

// Update round (protected)
router.put("/:roundId", protectRoute, updateRound);

// Generate draw for a round
router.post("/tournament/:tournamentId/round/:roundNumber/generate-draw", protectRoute, generateRoundDraw);

// Get draw for a round
router.get("/tournament/:tournamentId/round/:roundNumber/draw", getRoundDraw);

// Update round status
router.patch("/:roundId/status", protectRoute, updateRoundStatus);

export default router;
