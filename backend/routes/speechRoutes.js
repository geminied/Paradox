import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import {
	submitSpeech,
	getDebateSpeeches,
	getMySpeech,
	updateSpeech,
	deleteSpeech,
} from "../controllers/speechController.js";

const router = express.Router();

// Submit a speech
router.post("/:debateId/submit", protectRoute, submitSpeech);

// Get all speeches for a debate
router.get("/:debateId", getDebateSpeeches);

// Get my speeches for a debate
router.get("/:debateId/my", protectRoute, getMySpeech);

// Update speech
router.put("/:speechId", protectRoute, updateSpeech);

// Delete speech
router.delete("/:speechId", protectRoute, deleteSpeech);

export default router;
