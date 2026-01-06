import mongoose from "mongoose";

const motionSchema = new mongoose.Schema(
	{
		tournament: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Tournament",
			required: true,
		},
		round: {
			type: Number,
			required: true,
		},
		roundType: {
			type: String,
			enum: ["preliminary", "break", "semi", "final", "petite-final"],
			default: "preliminary",
		},
		motionText: {
			type: String,
			required: true,
		},
		infoSlide: {
			type: String,
			default: "",
		},
		motionType: {
			type: String,
			enum: ["open", "closed", "semi-closed"],
			default: "open",
		},
		// Motion release control
		isReleased: {
			type: Boolean,
			default: false,
		},
		releaseTime: {
			type: Date,
			default: null,
		},
		scheduledReleaseTime: {
			type: Date,
			default: null,
		},
		// Prep time in minutes (typically 15 for BP, 30 for AP)
		prepTime: {
			type: Number,
			default: 15,
		},
		// For archiving purposes
		isArchived: {
			type: Boolean,
			default: false,
		},
		archivedAt: {
			type: Date,
			default: null,
		},
		// Creator
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{ timestamps: true }
);

// Index for efficient queries
motionSchema.index({ tournament: 1, round: 1 });
motionSchema.index({ tournament: 1, isReleased: 1 });
motionSchema.index({ isArchived: 1 });

const Motion = mongoose.model("Motion", motionSchema);

export default Motion;
