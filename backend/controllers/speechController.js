import Speech from "../models/speechModel.js";
import DebateRoom from "../models/debateRoomModel.js";
import Team from "../models/teamModel.js";

// Submit a speech
const submitSpeech = async (req, res) => {
	try {
		const { debateId } = req.params;
		const { content, duration } = req.body;
		const userId = req.user._id;

		// Get debate room
		const debate = await DebateRoom.findById(debateId)
			.populate("teams.team");

		if (!debate) {
			return res.status(404).json({ error: "Debate room not found" });
		}

		// Check if debate is in progress
		if (debate.status !== "in-progress") {
			return res.status(400).json({ error: "Debate is not in progress" });
		}

		// Find the speaker's team and position
		let speakerTeam = null;
		let speakerPosition = null;

		for (const teamInfo of debate.teams) {
			const team = await Team.findById(teamInfo.team._id).populate("members");
			const isMember = team.members.some(member => member._id.toString() === userId.toString());
			
			if (isMember) {
				speakerTeam = team;
				speakerPosition = teamInfo.position;
				break;
			}
		}

		if (!speakerTeam) {
			return res.status(403).json({ error: "You are not a participant in this debate" });
		}

		// Check if it's the speaker's turn (simplified - just check if they haven't submitted for current speech)
		const existingSpeech = await Speech.findOne({
			debate: debateId,
			speaker: userId,
			speechNumber: debate.currentSpeechNumber,
		});

		if (existingSpeech) {
			return res.status(400).json({ error: "You have already submitted this speech" });
		}

		// Check if speech deadline has passed
		if (debate.speechDeadline && new Date() > debate.speechDeadline) {
			// Still allow submission but mark as late
		}

		const isLate = debate.speechDeadline && new Date() > debate.speechDeadline;

		// Create speech
		const speech = await Speech.create({
			debate: debateId,
			speaker: userId,
			team: speakerTeam._id,
			position: speakerPosition,
			speechNumber: debate.currentSpeechNumber,
			content,
			duration: duration || 0,
			isLate,
		});

		// Update debate room
		debate.completedSpeeches += 1;
		await debate.save();

		const populatedSpeech = await Speech.findById(speech._id)
			.populate("speaker", "name username")
			.populate("team", "name");

		res.status(201).json(populatedSpeech);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in submitSpeech: ", error.message);
	}
};

// Get all speeches for a debate
const getDebateSpeeches = async (req, res) => {
	try {
		const { debateId } = req.params;

		const speeches = await Speech.find({ debate: debateId })
			.populate("speaker", "name username")
			.populate("team", "name institution")
			.sort({ speechNumber: 1, createdAt: 1 });

		res.status(200).json(speeches);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getDebateSpeeches: ", error.message);
	}
};

// Get speaker's own speeches
const getMySpeech = async (req, res) => {
	try {
		const { debateId } = req.params;
		const userId = req.user._id;

		const speeches = await Speech.find({
			debate: debateId,
			speaker: userId,
		})
			.populate("team", "name")
			.sort({ speechNumber: 1 });

		res.status(200).json(speeches);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getMySpeech: ", error.message);
	}
};

// Update speech (before debate ends)
const updateSpeech = async (req, res) => {
	try {
		const { speechId } = req.params;
		const { content, duration } = req.body;
		const userId = req.user._id;

		const speech = await Speech.findById(speechId);

		if (!speech) {
			return res.status(404).json({ error: "Speech not found" });
		}

		// Check if user is the speaker
		if (speech.speaker.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only edit your own speeches" });
		}

		// Check if debate is still in progress
		const debate = await DebateRoom.findById(speech.debate);
		if (debate.status === "completed" || debate.status === "judging") {
			return res.status(400).json({ error: "Cannot edit speech after debate is completed" });
		}

		// Update speech
		speech.content = content || speech.content;
		speech.duration = duration || speech.duration;
		await speech.save();

		const updatedSpeech = await Speech.findById(speechId)
			.populate("speaker", "name username")
			.populate("team", "name");

		res.status(200).json(updatedSpeech);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in updateSpeech: ", error.message);
	}
};

// Delete speech
const deleteSpeech = async (req, res) => {
	try {
		const { speechId } = req.params;
		const userId = req.user._id;

		const speech = await Speech.findById(speechId);

		if (!speech) {
			return res.status(404).json({ error: "Speech not found" });
		}

		// Check if user is the speaker
		if (speech.speaker.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only delete your own speeches" });
		}

		// Check if debate is still in progress
		const debate = await DebateRoom.findById(speech.debate);
		if (debate.status === "completed" || debate.status === "judging") {
			return res.status(400).json({ error: "Cannot delete speech after debate is completed" });
		}

		await Speech.findByIdAndDelete(speechId);

		// Update debate room speech count
		debate.completedSpeeches = Math.max(0, debate.completedSpeeches - 1);
		await debate.save();

		res.status(200).json({ message: "Speech deleted successfully" });
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in deleteSpeech: ", error.message);
	}
};

export {
	submitSpeech,
	getDebateSpeeches,
	getMySpeech,
	updateSpeech,
	deleteSpeech,
};
