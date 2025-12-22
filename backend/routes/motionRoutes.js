import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import {
	createMotion,
	getTournamentMotions,
	getReleasedMotions,
	getMotionsByRound,
	updateMotion,
	releaseMotion,
	scheduleMotionRelease,
	deleteMotion,
	archiveMotion,
	getArchivedMotions,
	checkScheduledReleases,
	updateBreakThreshold,
} from "../controllers/motionController.js";

const router = express.Router();

// Public routes
router.get("/archive", getArchivedMotions);
router.get("/tournament/:tournamentId/released", getReleasedMotions);
router.get("/tournament/:tournamentId/round/:roundNumber", getMotionsByRound);

// Protected routes
router.post("/tournament/:tournamentId", protectRoute, createMotion);
router.get("/tournament/:tournamentId", protectRoute, getTournamentMotions);
router.put("/:motionId", protectRoute, updateMotion);
router.patch("/:motionId/release", protectRoute, releaseMotion);
router.patch("/:motionId/schedule", protectRoute, scheduleMotionRelease);
router.patch("/:motionId/archive", protectRoute, archiveMotion);
router.delete("/:motionId", protectRoute, deleteMotion);

// Break threshold (on tournament)
router.patch("/tournament/:tournamentId/break-threshold", protectRoute, updateBreakThreshold);

// System route for scheduled releases
router.post("/check-scheduled", checkScheduledReleases);

export default router;
