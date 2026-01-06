import mongoose from "mongoose";

const speechSchema = mongoose.Schema(
	{
		debate: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "DebateRoom",
			required: true,
		},
		speaker: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		team: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Team",
			required: true,
		},
		position: {
			type: String,
			required: true,
			// BP: PM, DPM, LO, DLO, MG, MO, GW, OW
			// AP: PM, LO (Proposition/Opposition)
		},
		speechNumber: {
			type: Number,
			required: true,
			// BP: 1-8, AP: 1-4 (including replies)
		},
		content: {
			type: String,
			required: true,
			trim: true,
		},
		submittedAt: {
			type: Date,
			default: Date.now,
		},
		duration: {
			type: Number, // in seconds
			default: 0,
		},
		isLate: {
			type: Boolean,
			default: false,
		},
		// For reply speeches
		isReply: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

// Index for efficient queries
speechSchema.index({ debate: 1, speechNumber: 1 });
speechSchema.index({ speaker: 1 });
speechSchema.index({ team: 1 });

const Speech = mongoose.model("Speech", speechSchema);

export default Speech;
