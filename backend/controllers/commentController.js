import Comment from "../models/commentModel.js";
import Debate from "../models/debateModel.js";
import User from "../models/userModel.js";

// Get comments for a debate (with nested replies)
const getComments = async (req, res) => {
	try {
		const { debateId } = req.params;

		// Get all comments for this debate
		const allComments = await Comment.find({ debate: debateId })
			.populate("author", "name username profilePic")
			.sort({ createdAt: 1 }); // Oldest first for proper threading

		// Build nested structure
		const commentMap = {};
		const rootComments = [];

		// First pass: create map
		allComments.forEach((comment) => {
			commentMap[comment._id.toString()] = {
				...comment.toObject(),
				replies: [],
			};
		});

		// Second pass: build tree
		allComments.forEach((comment) => {
			const commentObj = commentMap[comment._id.toString()];
			if (comment.parentComment) {
				const parent = commentMap[comment.parentComment.toString()];
				if (parent) {
					parent.replies.push(commentObj);
				} else {
					// Parent was deleted, treat as root
					rootComments.push(commentObj);
				}
			} else {
				rootComments.push(commentObj);
			}
		});

		// Calculate stance stats - ONLY for root comments (direct responses to debate)
		// Replies express stance towards parent comment, not the debate topic
		const rootCommentsList = allComments.filter((c) => !c.parentComment);
		const agreeCount = rootCommentsList.filter((c) => c.stance === "agree").length;
		const disagreeCount = rootCommentsList.filter((c) => c.stance === "disagree").length;

		res.status(200).json({
			comments: rootComments.reverse(), // Newest root comments first
			stats: {
				total: allComments.length,
				agreeCount,
				disagreeCount,
			},
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Create a comment (supports replies)
const createComment = async (req, res) => {
	try {
		const { debateId } = req.params;
		const { text, stance, parentCommentId } = req.body;
		const userId = req.user._id;

		if (!text || !stance) {
			return res.status(400).json({ error: "Text and stance are required" });
		}

		if (!["agree", "disagree"].includes(stance)) {
			return res.status(400).json({ error: "Stance must be 'agree' or 'disagree'" });
		}

		// Check if debate exists
		const debate = await Debate.findById(debateId);
		if (!debate) {
			return res.status(404).json({ error: "Debate not found" });
		}

		// If it's a reply, check parent exists
		if (parentCommentId) {
			const parentComment = await Comment.findById(parentCommentId);
			if (!parentComment) {
				return res.status(404).json({ error: "Parent comment not found" });
			}
			// Update parent's reply count
			await Comment.findByIdAndUpdate(parentCommentId, {
				$inc: { repliesCount: 1 },
			});
		}

		const newComment = new Comment({
			debate: debateId,
			author: userId,
			text,
			stance,
			parentComment: parentCommentId || null,
		});

		await newComment.save();

		// Update comments count on debate
		await Debate.findByIdAndUpdate(debateId, {
			$inc: { commentsCount: 1 },
		});

		const populatedComment = await Comment.findById(newComment._id).populate(
			"author",
			"name username profilePic"
		);

		res.status(201).json({
			...populatedComment.toObject(),
			replies: [],
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Toggle "Same point" reaction
const toggleSamePoint = async (req, res) => {
	try {
		const { commentId } = req.params;
		const userId = req.user._id;

		const comment = await Comment.findById(commentId);
		if (!comment) {
			return res.status(404).json({ error: "Comment not found" });
		}

		// Can't react to your own comment
		if (comment.author.toString() === userId.toString()) {
			return res.status(400).json({ error: "You can't react to your own comment" });
		}

		const hasReacted = comment.samePointReactions.includes(userId);

		if (hasReacted) {
			// Remove reaction
			comment.samePointReactions = comment.samePointReactions.filter(
				(id) => id.toString() !== userId.toString()
			);
		} else {
			// Add reaction (remove from goodPoint if exists)
			comment.goodPointReactions = comment.goodPointReactions.filter(
				(id) => id.toString() !== userId.toString()
			);
			comment.samePointReactions.push(userId);
		}

		await comment.save();

		res.status(200).json({
			samePointReactions: comment.samePointReactions,
			goodPointReactions: comment.goodPointReactions,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Toggle "Good point" reaction
const toggleGoodPoint = async (req, res) => {
	try {
		const { commentId } = req.params;
		const userId = req.user._id;

		const comment = await Comment.findById(commentId);
		if (!comment) {
			return res.status(404).json({ error: "Comment not found" });
		}

		// Can't react to your own comment
		if (comment.author.toString() === userId.toString()) {
			return res.status(400).json({ error: "You can't react to your own comment" });
		}

		const hasReacted = comment.goodPointReactions.includes(userId);

		if (hasReacted) {
			// Remove reaction
			comment.goodPointReactions = comment.goodPointReactions.filter(
				(id) => id.toString() !== userId.toString()
			);
		} else {
			// Add reaction (remove from samePoint if exists)
			comment.samePointReactions = comment.samePointReactions.filter(
				(id) => id.toString() !== userId.toString()
			);
			comment.goodPointReactions.push(userId);
		}

		await comment.save();

		res.status(200).json({
			samePointReactions: comment.samePointReactions,
			goodPointReactions: comment.goodPointReactions,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Delete a comment
const deleteComment = async (req, res) => {
	try {
		const { commentId } = req.params;
		const userId = req.user._id;

		const comment = await Comment.findById(commentId);
		if (!comment) {
			return res.status(404).json({ error: "Comment not found" });
		}

		if (comment.author.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only delete your own comments" });
		}

		const debateId = comment.debate;
		const parentId = comment.parentComment;

		// Delete all nested replies recursively
		const deleteReplies = async (parentId) => {
			const replies = await Comment.find({ parentComment: parentId });
			for (const reply of replies) {
				await deleteReplies(reply._id);
				await Comment.findByIdAndDelete(reply._id);
			}
		};

		await deleteReplies(commentId);
		await Comment.findByIdAndDelete(commentId);

		// Update parent's reply count if it was a reply
		if (parentId) {
			await Comment.findByIdAndUpdate(parentId, {
				$inc: { repliesCount: -1 },
			});
		}

		// Recalculate comments count on debate
		const remainingCount = await Comment.countDocuments({ debate: debateId });
		await Debate.findByIdAndUpdate(debateId, {
			commentsCount: remainingCount,
		});

		res.status(200).json({ message: "Comment deleted" });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export {
	getComments,
	createComment,
	toggleSamePoint,
	toggleGoodPoint,
	deleteComment,
};