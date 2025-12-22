import Team from "../models/teamModel.js";
import Round from "../models/roundModel.js";
import DebateRoom from "../models/debateRoomModel.js";
import Tournament from "../models/tournamentModel.js";

/**
 * Generate draw for a tournament round
 * Round 1: Random draw
 * Round 2+: Power-paired (teams with similar points face each other)
 */
export const generateDraw = async (tournamentId, roundNumber) => {
	try {
		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}

		// Get all active teams
		const teams = await Team.find({
			tournament: tournamentId,
			status: "active",
		});

		if (teams.length === 0) {
			throw new Error("No active teams found");
		}

		// Get the round
		const round = await Round.findOne({
			tournament: tournamentId,
			roundNumber,
		});

		if (!round) {
			throw new Error("Round not found");
		}

		let debates;

		if (roundNumber === 1) {
			// Random draw for Round 1
			debates = await generateRandomDraw(tournament, round, teams);
		} else {
			// Power-paired draw for Round 2+
			debates = await generatePowerPairedDraw(tournament, round, teams);
		}

		// Assign judges to debates
		await assignJudgesToDebates(tournament, debates);

		// Update round with debate references
		round.debates = debates.map(d => d._id);
		round.totalDebates = debates.length;
		round.isDrawReleased = true;
		round.drawReleasedAt = new Date();
		await round.save();

		return debates;
	} catch (error) {
		console.error("Error in generateDraw:", error);
		throw error;
	}
};

/**
 * Generate random draw for Round 1
 */
const generateRandomDraw = async (tournament, round, teams) => {
	const format = tournament.format;
	const teamsPerRoom = format === "BP" ? 4 : 2;

	// Shuffle teams randomly
	const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

	// Group teams into rooms
	const debates = [];
	const numberOfRooms = Math.floor(shuffledTeams.length / teamsPerRoom);

	for (let i = 0; i < numberOfRooms; i++) {
		const roomTeams = shuffledTeams.slice(i * teamsPerRoom, (i + 1) * teamsPerRoom);

		// Assign positions
		let teamsWithPositions;
		if (format === "BP") {
			teamsWithPositions = roomTeams.map((team, index) => ({
				team: team._id,
				position: ["OG", "OO", "CG", "CO"][index],
			}));
		} else {
			teamsWithPositions = roomTeams.map((team, index) => ({
				team: team._id,
				position: ["Proposition", "Opposition"][index],
			}));
		}

		// Create debate room
		const debate = new DebateRoom({
			tournament: tournament._id,
			round: round._id,
			roomName: `Room ${i + 1}`,
			teams: teamsWithPositions,
			status: "scheduled",
		});

		await debate.save();
		debates.push(debate);
	}

	return debates;
};

/**
 * Generate power-paired draw for Round 2+
 * Teams with similar points face each other
 */
const generatePowerPairedDraw = async (tournament, round, teams) => {
	const format = tournament.format;
	const teamsPerRoom = format === "BP" ? 4 : 2;

	// Sort teams by total points (descending), then by speaker scores
	const sortedTeams = teams.sort((a, b) => {
		if (b.totalPoints !== a.totalPoints) {
			return b.totalPoints - a.totalPoints;
		}
		return b.totalSpeaks - a.totalSpeaks;
	});

	// Bracket teams (groups of similar strength)
	const debates = [];
	const numberOfRooms = Math.floor(sortedTeams.length / teamsPerRoom);

	for (let i = 0; i < numberOfRooms; i++) {
		const roomTeams = sortedTeams.slice(i * teamsPerRoom, (i + 1) * teamsPerRoom);

		// Balance institutions - try to avoid same institution in one room
		const balancedTeams = balanceInstitutions(roomTeams);

		// Assign positions
		let teamsWithPositions;
		if (format === "BP") {
			// Assign positions balancing institution conflicts
			teamsWithPositions = balancedTeams.map((team, index) => ({
				team: team._id,
				position: ["OG", "OO", "CG", "CO"][index],
			}));
		} else {
			teamsWithPositions = balancedTeams.map((team, index) => ({
				team: team._id,
				position: ["Proposition", "Opposition"][index],
			}));
		}

		// Create debate room
		const debate = new DebateRoom({
			tournament: tournament._id,
			round: round._id,
			roomName: `Room ${i + 1}`,
			teams: teamsWithPositions,
			status: "scheduled",
		});

		await debate.save();
		debates.push(debate);
	}

	return debates;
};

/**
 * Balance institutions in a room
 * Try to avoid teams from same institution facing each other
 */
const balanceInstitutions = (teams) => {
	// Count institutions
	const institutionCounts = {};
	teams.forEach(team => {
		institutionCounts[team.institution] = (institutionCounts[team.institution] || 0) + 1;
	});

	// If all different institutions or all same institution, return as is
	const uniqueInstitutions = Object.keys(institutionCounts).length;
	if (uniqueInstitutions === teams.length || uniqueInstitutions === 1) {
		return teams;
	}

	// Simple balancing: shuffle teams while trying to separate same institutions
	const balanced = [...teams];
	for (let i = 0; i < balanced.length - 1; i++) {
		for (let j = i + 1; j < balanced.length; j++) {
			if (balanced[i].institution === balanced[j].institution) {
				// Try to swap with a different institution
				for (let k = j + 1; k < balanced.length; k++) {
					if (balanced[i].institution !== balanced[k].institution &&
						balanced[j].institution !== balanced[k].institution) {
						[balanced[j], balanced[k]] = [balanced[k], balanced[j]];
						break;
					}
				}
			}
		}
	}

	return balanced;
};

/**
 * Assign judges to debates
 * Avoid conflicts (judges from same institution as teams)
 */
const assignJudgesToDebates = async (tournament, debates) => {
	const judges = await tournament.populate("judges");
	const availableJudges = tournament.judges;

	if (availableJudges.length === 0) {
		console.warn("No judges available for tournament");
		return;
	}

	// Number of judges per room (ideally 3 for BP, 1 for AP)
	const judgesPerRoom = tournament.format === "BP" ? 3 : 1;

	for (const debate of debates) {
		// Get team institutions in this debate
		const teams = await Team.find({ _id: { $in: debate.teams.map(t => t.team) } });
		const teamInstitutions = teams.map(t => t.institution);

		// Filter judges without conflicts
		const eligibleJudges = availableJudges.filter(judge => {
			// Check if judge has conflict with any team
			const hasConflict = teamInstitutions.some(inst =>
				judge.judgeProfile?.conflictInstitutions?.includes(inst) ||
				judge.institution === inst
			);
			return !hasConflict;
		});

		// Assign judges (up to judgesPerRoom)
		const assignedJudges = eligibleJudges.slice(0, judgesPerRoom);
		
		debate.judges = assignedJudges.map(j => j._id);
		
		// Set chair (first judge)
		if (assignedJudges.length > 0) {
			debate.chair = assignedJudges[0]._id;
		}

		await debate.save();
	}
};

/**
 * Check if draw can be generated
 */
export const canGenerateDraw = async (tournamentId, roundNumber) => {
	const tournament = await Tournament.findById(tournamentId);
	if (!tournament) {
		return { canGenerate: false, reason: "Tournament not found" };
	}

	const teams = await Team.find({
		tournament: tournamentId,
		status: "active",
	});

	const teamsPerRoom = tournament.format === "BP" ? 4 : 2;

	if (teams.length < teamsPerRoom) {
		return {
			canGenerate: false,
			reason: `Not enough teams. Need at least ${teamsPerRoom} teams.`,
		};
	}

	const round = await Round.findOne({ tournament: tournamentId, roundNumber });
	if (!round) {
		return { canGenerate: false, reason: "Round not found" };
	}

	if (round.isDrawReleased) {
		return { canGenerate: false, reason: "Draw already generated for this round" };
	}

	return { canGenerate: true };
};

export default {
	generateDraw,
	canGenerateDraw,
};
