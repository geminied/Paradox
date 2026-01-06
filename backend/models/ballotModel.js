import mongoose from "mongoose";

const ballotSchema = mongoose.Schema(
	{
		debate: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "DebateRoom",
			required: true,
		},
		judge: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		tournament: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Tournament",
			required: true,
		},
		// Team Rankings (for BP: 1st, 2nd, 3rd, 4th)
		rankings: [
			{
				team: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Team",
					required: true,
				},
				rank: {
					type: Number,
					required: true,
					min: 1,
					max: 4, // For BP format
				},
			},
		],
		// Speaker Scores
		speakerScores: [
			{
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
				score: {
					type: Number,
					required: true,
					min: 70, // BP range: 70-80
					max: 80,
				},
				breakdown: {
					content: {
						type: Number,
						min: 0,
						max: 40,
						default: 0,
					},
					style: {
						type: Number,
						min: 0,
						max: 40,
						default: 0,
					},
					strategy: {
						type: Number,
						min: 0,
						max: 20,
						default: 0,
					},
				},
			},
		],
		// Feedback per team
		teamFeedback: [
			{
				team: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Team",
				},
				strengths: {
					type: String,
					default: "",
				},
				weaknesses: {
					type: String,
					default: "",
				},
				advice: {
					type: String,
					default: "",
				},
			},
		],
		// Overall feedback
		overallFeedback: {
			type: String,
			default: "",
		},
		// Status tracking
		status: {
			type: String,
			enum: ["draft", "submitted"],
			default: "draft",
		},
		submittedAt: Date,
		// For panel judging
		isChairBallot: {
			type: Boolean,
			default: false,
		},
		// Auto-save tracking
		lastSavedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes
ballotSchema.index({ debate: 1, judge: 1 }, { unique: true }); // One ballot per judge per debate
ballotSchema.index({ tournament: 1 });
ballotSchema.index({ judge: 1, status: 1 });

// Validation: Ensure no duplicate ranks
ballotSchema.pre("save", function (next) {
	if (this.rankings && this.rankings.length > 0) {
		const ranks = this.rankings.map((r) => r.rank);
		const uniqueRanks = new Set(ranks);
		if (ranks.length !== uniqueRanks.size) {
			return next(new Error("Duplicate rankings are not allowed"));
		}
	}
	next();
});

const Ballot = mongoose.model("Ballot", ballotSchema);

export default Ballot;
