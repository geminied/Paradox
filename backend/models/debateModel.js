import mongoose from "mongoose";

const debateSchema = mongoose.Schema(
	{
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		category: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		context: {
			type: String,
			default: "",
		},
		upvotes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		commentsCount: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
);

const Debate = mongoose.model("Debate", debateSchema);

export default Debate;