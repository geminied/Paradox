import express from "express";
import {
	getDebateRoom,
	submitDebate,
	enterResults,
	getTeamDebates,
	getJudgeDebates,
	updateDebateStatus,
} from "../controllers/debateRoomController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

// Get debate room details
router.get("/:debateId", getDebateRoom);

// Submit debate for a team
router.post("/:debateId/submit", protectRoute, submitDebate);

// Enter results (judge only)
router.post("/:debateId/results", protectRoute, enterResults);

// Get debates for a team
router.get("/team/:teamId", getTeamDebates);

// Get debates for a judge
router.get("/judge/my-debates", protectRoute, getJudgeDebates);

// Update debate status
router.patch("/:debateId/status", protectRoute, updateDebateStatus);

export default router;
