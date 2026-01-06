import mongoose from "mongoose";

const notificationSchema = mongoose.Schema(
	{
		recipient: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false,
		},
		type: {
			type: String,
			enum: [
				"follow",           // Someone followed you
				"comment",          // Someone commented on your debate
				"reply",            // Someone replied to your comment
				"upvote",           // Someone upvoted your debate
				"reaction",         // Someone reacted to your comment (samePoint/goodPoint)
				"TEAM_REGISTERED",  // Someone added you to a tournament team
			],
			required: true,
		},
		debate: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Debate",
		},
		comment: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment",
		},
		read: {
			type: Boolean,
			default: false,
		},
		message: {
			type: String,
			required: true,
		},
		link: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

// Index for faster queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
