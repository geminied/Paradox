import express from "express";
import {
	createDebate,
	getDebates,
	getDebate,
	toggleUpvote,
	searchCategories,
	deleteDebate,
	getHotTopics,
	getSuggestedDebates,
	getDebatesByCategory,
} from "../controllers/debateController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

// Static routes MUST come before dynamic :id routes
router.get("/feed", getDebates);
router.get("/hot", getHotTopics);
router.get("/suggested", protectRoute, getSuggestedDebates);
router.get("/categories", searchCategories);
router.get("/category/:category", getDebatesByCategory);
router.post("/create", protectRoute, createDebate);

// Dynamic routes with :id MUST come AFTER static routes
router.get("/:id", getDebate);
router.post("/:id/upvote", protectRoute, toggleUpvote);
router.delete("/:id", protectRoute, deleteDebate);

export default router;