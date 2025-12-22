import mongoose from "mongoose";

const teamSchema = mongoose.Schema(
	{
		tournament: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Tournament",
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		institution: {
			type: String,
			required: true,
			trim: true,
		},
		captain: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		members: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		speakerOrder: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		status: {
			type: String,
			enum: ["pending", "confirmed", "withdrawn"],
			default: "confirmed",
		},
		totalPoints: {
			type: Number,
			default: 0,
		},
		totalSpeaks: {
			type: Number,
			default: 0,
		},
		teamBreaks: {
			open: { type: Boolean, default: false },
			novice: { type: Boolean, default: false },
			esl: { type: Boolean, default: false },
		},
		withdrawnAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

// Index for efficient queries
teamSchema.index({ tournament: 1, status: 1 });
teamSchema.index({ captain: 1 });
teamSchema.index({ tournament: 1, institution: 1 });

// Ensure unique team names within tournaments (but allow null during creation)
teamSchema.index({ tournament: 1, name: 1 }, { unique: true, sparse: true });

const Team = mongoose.model("Team", teamSchema);

export default Team;
