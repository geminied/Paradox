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

export default router;
