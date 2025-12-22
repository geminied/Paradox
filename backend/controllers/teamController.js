import Team from "../models/teamModel.js";
import Tournament from "../models/tournamentModel.js";
import User from "../models/userModel.js";
import { createNotification } from "./notificationController.js";

// Register team for tournament
const registerTeam = async (req, res) => {
	try {
		const { tournamentId } = req.params;
		const { name, institution, members, speakerOrder } = req.body;
		const userId = req.user._id;

		// Validation
		if (!name || !institution || !members || members.length === 0) {
			return res.status(400).json({ error: "Name, institution, and members are required" });
		}

		// Check tournament exists and is accepting registrations
		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			return res.status(404).json({ error: "Tournament not found" });
		}

		if (tournament.status !== "draft" && tournament.status !== "registration") {
			return res.status(400).json({ error: "Tournament is not accepting registrations" });
		}

		// Validate number of members based on format
		const expectedMembers = tournament.speakersPerTeam || (tournament.format === "BP" ? 2 : 3);
		if (members.length !== expectedMembers) {
			return res.status(400).json({ 
				error: `Team must have exactly ${expectedMembers} members for ${tournament.format} format` 
			});
		}

		// Check if captain is in members
		if (!members.includes(userId.toString())) {
			members.push(userId.toString());
		}

		// Check if user already has a team in this tournament
		const existingTeam = await Team.findOne({
			tournament: tournamentId,
			members: userId,
			status: { $ne: "withdrawn" },
		});

		if (existingTeam) {
			return res.status(400).json({ error: "You are already registered in a team for this tournament" });
		}

		// Check max teams limit
		const teamsCount = await Team.countDocuments({ 
			tournament: tournamentId, 
			status: { $ne: "withdrawn" } 
		});
		
		if (teamsCount >= tournament.maxTeams) {
			return res.status(400).json({ error: "Tournament has reached maximum teams capacity" });
		}

		// Validate all members exist
		const memberUsers = await User.find({ _id: { $in: members } });
		if (memberUsers.length !== members.length) {
			return res.status(400).json({ error: "One or more team members not found" });
		}

		// Check if any member is already in another team
		for (const memberId of members) {
			const memberTeam = await Team.findOne({
				tournament: tournamentId,
				members: memberId,
				status: { $ne: "withdrawn" },
			});
			if (memberTeam) {
				const member = memberUsers.find(u => u._id.toString() === memberId.toString());
				return res.status(400).json({ 
					error: `${member.name} is already registered in another team` 
				});
			}
		}

		// Create team
		const newTeam = new Team({
			tournament: tournamentId,
			name,
			institution,
			captain: userId,
			members,
			speakerOrder: speakerOrder || members,
			status: "confirmed",
		});

		await newTeam.save();

		// Add team to tournament participants
		await Tournament.findByIdAndUpdate(tournamentId, {
			$addToSet: { participants: { $each: members } },
		});

		// Notify team members
		for (const memberId of members) {
			if (memberId.toString() !== userId.toString()) {
				await createNotification({
					recipient: memberId,
					sender: userId,
					type: "TEAM_REGISTERED",
					message: `You have been added to team "${name}" for ${tournament.name}`,
					link: `/tournaments/${tournamentId}`,
				});
			}
		}

		// Populate team details
		await newTeam.populate("captain", "name username");
		await newTeam.populate("members", "name username");

		res.status(201).json(newTeam);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in registerTeam: ", error.message);
	}
};

// Update team details
const updateTeam = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, institution, members, speakerOrder } = req.body;
		const userId = req.user._id;

		const team = await Team.findById(id);
		if (!team) {
			return res.status(404).json({ error: "Team not found" });
		}

		// Only captain can update team
		if (team.captain.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only team captain can update team details" });
		}

		// Check tournament status - can't update after tournament starts
		const tournament = await Tournament.findById(team.tournament);
		if (tournament.status === "ongoing" || tournament.status === "completed") {
			return res.status(400).json({ error: "Cannot update team after tournament has started" });
		}

		// Update fields
		if (name) team.name = name;
		if (institution) team.institution = institution;
		if (members) {
			const expectedMembers = tournament.speakersPerTeam || (tournament.format === "BP" ? 2 : 3);
			if (members.length !== expectedMembers) {
				return res.status(400).json({ 
					error: `Team must have exactly ${expectedMembers} members` 
				});
			}
			team.members = members;
		}
		if (speakerOrder) team.speakerOrder = speakerOrder;

		await team.save();
		await team.populate("captain", "name username");
		await team.populate("members", "name username");

		res.status(200).json(team);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in updateTeam: ", error.message);
	}
};

// Withdraw team from tournament
const withdrawTeam = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const team = await Team.findById(id);
		if (!team) {
			return res.status(404).json({ error: "Team not found" });
		}

		// Only captain can withdraw team
		if (team.captain.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Only team captain can withdraw team" });
		}

		// Check tournament status
		const tournament = await Tournament.findById(team.tournament);
		if (tournament.status === "completed") {
			return res.status(400).json({ error: "Cannot withdraw after tournament completion" });
		}

		team.status = "withdrawn";
		team.withdrawnAt = new Date();
		await team.save();

		res.status(200).json({ message: "Team withdrawn successfully" });
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in withdrawTeam: ", error.message);
	}
};

// Get teams for a tournament
const getTeamsByTournament = async (req, res) => {
	try {
		const { tournamentId } = req.params;

		const teams = await Team.find({ 
			tournament: tournamentId,
			status: { $ne: "withdrawn" }
		})
			.populate("captain", "name username")
			.populate("members", "name username")
			.sort({ createdAt: 1 });

		res.status(200).json(teams);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getTeamsByTournament: ", error.message);
	}
};

// Get user's teams
const getMyTeams = async (req, res) => {
	try {
		const userId = req.user._id;

		const teams = await Team.find({
			$or: [{ captain: userId }, { members: userId }],
			status: { $ne: "withdrawn" }
		})
			.populate("tournament", "name format status startDate endDate")
			.populate("captain", "name username")
			.populate("members", "name username")
			.sort({ createdAt: -1 });

		res.status(200).json(teams);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getMyTeams: ", error.message);
	}
};

// Get single team details
const getTeam = async (req, res) => {
	try {
		const { id } = req.params;

		const team = await Team.findById(id)
			.populate("tournament", "name format status startDate endDate")
			.populate("captain", "name username institution")
			.populate("members", "name username institution")
			.populate("speakerOrder", "name username");

		if (!team) {
			return res.status(404).json({ error: "Team not found" });
		}

		res.status(200).json(team);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getTeam: ", error.message);
	}
};

export { 
	registerTeam, 
	updateTeam, 
	withdrawTeam, 
	getTeamsByTournament, 
	getMyTeams, 
	getTeam 
};
