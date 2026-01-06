import mongoose from "mongoose";

const tournamentSchema = mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			default: "",
		},
		format: {
			type: String,
			enum: ["BP", "AP"], // British Parliamentary, Asian Parliamentary
			required: true,
		},
		category: {
			type: String,
			enum: ["school", "college", "open", "novice"],
			default: "open",
		},
		creator: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		status: {
			type: String,
			enum: ["draft", "registration", "ongoing", "completed", "cancelled"],
			default: "draft",
		},
		registrationDeadline: {
			type: Date,
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
			required: true,
		},
		maxTeams: {
			type: Number,
			default: 32,
		},
		speakersPerTeam: {
			type: Number,
			default: 2, // 2 for BP, 3 for AP - will be set based on format
		},
		numberOfRounds: {
			type: Number,
			default: 5,
		},
		breakingTeams: {
			type: Number,
			default: 8, // Teams that advance to elimination rounds
		},
		speakerScoreRange: {
			min: {
				type: Number,
				default: 70, // BP default, 65 for AP
			},
			max: {
				type: Number,
				default: 80, // BP default, 100 for AP
			},
		},
		judges: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		isArchived: {
			type: Boolean,
			default: false,
		},
		archivedAt: {
			type: Date,
			default: null,
		},
		archivedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

// Middleware to set default values based on format
tournamentSchema.pre("save", function (next) {
	if (this.isNew || this.isModified("format")) {
		if (this.format === "BP") {
			this.speakersPerTeam = 2;
			if (!this.speakerScoreRange.min) this.speakerScoreRange.min = 70;
			if (!this.speakerScoreRange.max) this.speakerScoreRange.max = 80;
		} else if (this.format === "AP") {
			this.speakersPerTeam = 3;
			if (!this.speakerScoreRange.min) this.speakerScoreRange.min = 65;
			if (!this.speakerScoreRange.max) this.speakerScoreRange.max = 100;
		}
	}
	next();
});

const Tournament = mongoose.model("Tournament", tournamentSchema);

export default Tournament;
