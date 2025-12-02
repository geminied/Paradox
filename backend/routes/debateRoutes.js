import express from "express";
import {
	createDebate,
	getDebates,
	getDebate,
	toggleUpvote,
	searchCategories,
	deleteDebate,
} from "../controllers/debateController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/feed", getDebates);
router.get("/categories", searchCategories);
router.get("/:id", getDebate);
router.post("/create", protectRoute, createDebate);
router.post("/:id/upvote", protectRoute, toggleUpvote);
router.delete("/:id", protectRoute, deleteDebate);

export default router;