import express from "express";
import {
	registerTeam,
	updateTeam,
	withdrawTeam,
	getTeamsByTournament,
	getMyTeams,
	getTeam,
} from "../controllers/teamController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

// Get user's teams
router.get("/my", protectRoute, getMyTeams);

// Get teams for a tournament
router.get("/tournament/:tournamentId", getTeamsByTournament);

// Get single team
router.get("/:id", getTeam);

// Register team for tournament
router.post("/register/:tournamentId", protectRoute, registerTeam);

// Update team
router.put("/:id", protectRoute, updateTeam);

// Withdraw team
router.delete("/:id/withdraw", protectRoute, withdrawTeam);

export default router;
