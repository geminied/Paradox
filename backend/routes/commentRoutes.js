import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import {
	getComments,
	createComment,
	toggleSamePoint,
	toggleGoodPoint,
	deleteComment,
} from "../controllers/commentController.js";

const router = express.Router();

// Get comments for a debate (public)
router.get("/:debateId", getComments);

// Create a comment (protected)
router.post("/:debateId", protectRoute, createComment);

// Toggle "Same point" reaction (protected)
router.post("/:commentId/same-point", protectRoute, toggleSamePoint);

// Toggle "Good point" reaction (protected)
router.post("/:commentId/good-point", protectRoute, toggleGoodPoint);

// Delete a comment (protected)
router.delete("/:commentId", protectRoute, deleteComment);

export default router;