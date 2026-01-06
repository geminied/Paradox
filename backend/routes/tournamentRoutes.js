import express from "express";
import {
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
} from "../controllers/tournamentController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

// Public routes
router.get("/feed", getTournaments);

// Protected routes - static routes MUST come before dynamic :id routes
router.get("/my", protectRoute, getMyTournaments);
router.get("/joined", protectRoute, getJoinedTournaments);
router.post("/create", protectRoute, createTournament);

// Dynamic routes with :id MUST come AFTER static routes
router.get("/:id", getTournament);
router.put("/:id", protectRoute, updateTournament);
router.delete("/:id", protectRoute, deleteTournament);
router.patch("/:id/status", protectRoute, updateTournamentStatus);

// Judge management routes
router.post("/:tournamentId/judges", protectRoute, addJudgeToTournament);
router.delete("/:tournamentId/judges/:judgeId", protectRoute, removeJudgeFromTournament);
router.get("/:tournamentId/judges", getJudgesForTournament);
router.get("/:tournamentId/judges/conflicts", getJudgeConflicts);

// Round routes
router.get("/:tournamentId/rounds", getRounds);

// Draw routes
router.post("/rounds/:roundId/generate-draw", protectRoute, generateDraw);
router.get("/rounds/:roundId/draw", getDraw);
router.delete("/rounds/:roundId/draw", protectRoute, deleteDraw);

// Standings routes
router.get("/:tournamentId/standings", getStandings);
router.get("/:tournamentId/speakers", getSpeakerStandings);

export default router;
