import mongoose from "mongoose";

const roundSchema = mongoose.Schema(
	{
		tournament: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Tournament",
			required: true,
		},
		roundNumber: {
			type: Number,
			required: true,
		},
		roundType: {
			type: String,
			enum: ["preliminary", "break", "semi", "final", "petite-final"],
			default: "preliminary",
		},
		motion: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Motion",
		},
		status: {
			type: String,
			enum: ["scheduled", "in-progress", "completed", "cancelled"],
			default: "scheduled",
		},
		// Debate rooms for this round
		debates: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: "DebateRoom",
		}],
		// Timing
		startTime: Date,
		prepEndTime: Date, // When prep time ends and debate starts
		submissionDeadline: Date,
		// Tracking
		isDrawReleased: {
			type: Boolean,
			default: false,
		},
		drawReleasedAt: Date,
		completedDebates: {
			type: Number,
			default: 0,
		},
		totalDebates: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
);

// Compound index for tournament and round number
roundSchema.index({ tournament: 1, roundNumber: 1 }, { unique: true });

const Round = mongoose.model("Round", roundSchema);

export default Round;
