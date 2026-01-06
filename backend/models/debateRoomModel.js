import mongoose from "mongoose";

const debateRoomSchema = mongoose.Schema(
	{
		tournament: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Tournament",
			required: true,
		},
		round: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Round",
			required: true,
		},
		roomName: {
			type: String,
			required: true,
		},
		// Teams in this debate (BP: 4 teams, AP: 2 teams)
		teams: [{
			team: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Team",
				required: true,
			},
			position: {
				type: String,
				enum: ["OG", "OO", "CG", "CO", "Proposition", "Opposition"],
				required: true,
			},
			// Team results for this debate
			rank: Number, // 1-4 for BP, 1-2 for AP
			points: Number, // 3, 2, 1, 0 for BP; 1, 0 for AP
			speakerScores: [{
				speaker: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				score: Number,
			}],
			totalSpeaks: Number,
			hasSubmitted: {
				type: Boolean,
				default: false,
			},
			submittedAt: Date,
			submissionText: String, // The actual debate submission
		}],
		// Judges for this debate
		judges: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		}],
		chair: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		// Status tracking
		status: {
			type: String,
			enum: ["scheduled", "prep", "in-progress", "submitted", "judging", "completed"],
			default: "scheduled",
		},
		// Timing
		prepStartTime: Date,
		prepDuration: {
			type: Number,
			default: 0.167, // minutes (10 seconds)
		},
		debateStartTime: Date,
		speechDuration: {
			type: Number,
			default: 0.5, // minutes per speech (30 seconds)
		},
		currentSpeechNumber: {
			type: Number,
			default: 1,
		},
		currentSpeaker: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		speechDeadline: Date,
		// Track submitted speeches
		totalSpeeches: {
			type: Number,
			default: 0,
		},
		completedSpeeches: {
			type: Number,
			default: 0,
		},
		// Results
		hasResults: {
			type: Boolean,
			default: false,
		},
		resultsEnteredBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		resultsEnteredAt: Date,
		// Feedback
		feedback: String,
		ballotSubmitted: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes
debateRoomSchema.index({ tournament: 1, round: 1 });
debateRoomSchema.index({ "teams.team": 1 });

const DebateRoom = mongoose.model("DebateRoom", debateRoomSchema);

export default DebateRoom;
