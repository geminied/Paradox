import mongoose from "mongoose";

const commentSchema = mongoose.Schema(
	{
		debate: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Debate",
			required: true,
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		parentComment: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment",
			default: null,
		},
		stance: {
			type: String,
			enum: ["agree", "disagree"],
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		// Reactions for empathy points
		samePointReactions: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		goodPointReactions: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		repliesCount: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
);

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;