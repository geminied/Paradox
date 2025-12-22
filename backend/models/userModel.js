import mongoose from "mongoose";

const userSchema = mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			minLength: 6,
			required: true,
		},
		bio: {
			type: String,
			default: "",
		},
		institution: {
			type: String,
			default: "",
		},
		debatingExperience: {
			tournaments: { type: Number, default: 0 },
			wins: { type: Number, default: 0 },
			speakerAwards: { type: Number, default: 0 },
		},
		preferredFormats: [
			{
				type: String,
				enum: ["BP", "AP"],
			},
		],
		// Judge Profile (self-activated)
		judgeProfile: {
			isActive: { type: Boolean, default: false }, // User can toggle on/off
			experience: {
				type: String,
				enum: ["novice", "intermediate", "experienced", "senior"],
				default: "novice",
			},
			conflictInstitutions: [String],
			bio: { type: String, default: "" },
			availableForTournaments: { type: Boolean, default: true },
		},
		followers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		following: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		bookmarks: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Debate",
			},
		],
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model("User", userSchema);

export default User;
