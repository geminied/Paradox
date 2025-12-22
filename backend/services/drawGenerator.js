import Team from "../models/teamModel.js";
import DebateRoom from "../models/debateRoomModel.js";
import User from "../models/userModel.js";
import Tournament from "../models/tournamentModel.js";

/**
 * Shuffle array using Fisher-Yates algorithm
 */
const shuffleArray = (array) => {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
};

/**
 * Check if two teams are from the same institution
 */
const sameInstitution = (team1, team2) => {
	return team1.institution && team2.institution && 
		   team1.institution.toLowerCase() === team2.institution.toLowerCase();
};

/**
 * Check if a judge has conflict with any team in the room
 */
const hasConflict = (judge, teams) => {
	if (!judge.judgeProfile?.conflictInstitutions) return false;
	
	const conflictInsts = judge.judgeProfile.conflictInstitutions.map(c => c.toLowerCase());
	
	for (const team of teams) {
		if (team.institution && conflictInsts.includes(team.institution.toLowerCase())) {
			return true;
		}
	}
	return false;
};

/**
 * Generate Round 1 Draw (Random with institution balancing)
 */
export const generateRound1Draw = async (tournamentId, roundId, format) => {
	try {
		// Get all confirmed teams
		const teams = await Team.find({
			tournament: tournamentId,
			status: "confirmed"
		}).populate("members", "name");

		if (teams.length < 2) {
			throw new Error("Not enough teams to generate draw");
		}

		const teamsPerRoom = format === "BP" ? 4 : 2;
		const rooms = [];
		let roomNumber = 1;

		// Shuffle teams
		let shuffledTeams = shuffleArray(teams);
		
		// Try to balance institutions in rooms
		const maxAttempts = 10;
		let bestDraw = null;
		let minConflicts = Infinity;

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			shuffledTeams = shuffleArray(teams);
			let conflicts = 0;
			const tempRooms = [];

			// Group teams into rooms
			for (let i = 0; i < shuffledTeams.length; i += teamsPerRoom) {
				const roomTeams = shuffledTeams.slice(i, i + teamsPerRoom);
				
				if (roomTeams.length < teamsPerRoom && shuffledTeams.length >= teamsPerRoom) {
					continue; // Skip incomplete rooms
				}

				// Count institution conflicts in this room
				for (let j = 0; j < roomTeams.length; j++) {
					for (let k = j + 1; k < roomTeams.length; k++) {
						if (sameInstitution(roomTeams[j], roomTeams[k])) {
							conflicts++;
						}
					}
				}

				tempRooms.push(roomTeams);
			}

			if (conflicts < minConflicts) {
				minConflicts = conflicts;
				bestDraw = tempRooms;
			}

			if (conflicts === 0) break; // Perfect draw found
		}

		// Create debate rooms from best draw
		for (const roomTeams of bestDraw) {
			if (roomTeams.length !== teamsPerRoom) continue;

			const room = {
				tournament: tournamentId,
				round: roundId,
				roomName: `Room ${roomNumber}`,
				teams: []
			};

			if (format === "BP") {
				// Assign positions: OG, OO, CG, CO
				const positions = ["OG", "OO", "CG", "CO"];
				roomTeams.forEach((team, index) => {
					room.teams.push({
						team: team._id,
						position: positions[index],
						hasSubmitted: false
					});
				});
			} else {
				// AP format: Proposition, Opposition
				const positions = ["Proposition", "Opposition"];
				roomTeams.forEach((team, index) => {
					room.teams.push({
						team: team._id,
						position: positions[index],
						hasSubmitted: false
					});
				});
			}

			rooms.push(room);
			roomNumber++;
		}

		return rooms;
	} catch (error) {
		throw new Error(`Error generating round 1 draw: ${error.message}`);
	}
};

/**
 * Generate Power-Paired Draw (Rounds 2+)
 */
export const generatePowerPairedDraw = async (tournamentId, roundId, format) => {
	try {
		// Get all teams with their current standings
		const teams = await Team.find({
			tournament: tournamentId,
			status: "confirmed"
		})
		.populate("members", "name")
		.sort({ totalPoints: -1, totalSpeaks: -1 }); // Sort by points, then speaks

		if (teams.length < 2) {
			throw new Error("Not enough teams to generate draw");
		}

		const teamsPerRoom = format === "BP" ? 4 : 2;
		const rooms = [];
		let roomNumber = 1;

		// Group teams by similar points (power-pairing)
		const brackets = [];
		let currentBracket = [];
		let currentPoints = teams[0].totalPoints;

		for (const team of teams) {
			if (team.totalPoints === currentPoints) {
				currentBracket.push(team);
			} else {
				brackets.push(currentBracket);
				currentBracket = [team];
				currentPoints = team.totalPoints;
			}
		}
		if (currentBracket.length > 0) {
			brackets.push(currentBracket);
		}

		// Create rooms from brackets
		let teamsPool = [];
		for (const bracket of brackets) {
			teamsPool.push(...shuffleArray(bracket));

			while (teamsPool.length >= teamsPerRoom) {
				const roomTeams = teamsPool.splice(0, teamsPerRoom);

				// Try to minimize institution conflicts
				let swapAttempts = 0;
				while (swapAttempts < 5) {
					let hasConflict = false;
					for (let i = 0; i < roomTeams.length; i++) {
						for (let j = i + 1; j < roomTeams.length; j++) {
							if (sameInstitution(roomTeams[i], roomTeams[j])) {
								hasConflict = true;
								// Try to swap with a team from the pool
								if (teamsPool.length > 0) {
									const swapIndex = Math.floor(Math.random() * teamsPool.length);
									[roomTeams[j], teamsPool[swapIndex]] = [teamsPool[swapIndex], roomTeams[j]];
								}
								break;
							}
						}
						if (hasConflict) break;
					}
					if (!hasConflict) break;
					swapAttempts++;
				}

				// Create room
				const room = {
					tournament: tournamentId,
					round: roundId,
					roomName: `Room ${roomNumber}`,
					teams: []
				};

				if (format === "BP") {
					const positions = ["OG", "OO", "CG", "CO"];
					roomTeams.forEach((team, index) => {
						room.teams.push({
							team: team._id,
							position: positions[index],
							hasSubmitted: false
						});
					});
				} else {
					const positions = ["Proposition", "Opposition"];
					roomTeams.forEach((team, index) => {
						room.teams.push({
							team: team._id,
							position: positions[index],
							hasSubmitted: false
						});
					});
				}

				rooms.push(room);
				roomNumber++;
			}
		}

		// Handle remaining teams (pull-up from lower brackets if needed)
		if (teamsPool.length > 0 && teamsPool.length < teamsPerRoom) {
			console.log(`Warning: ${teamsPool.length} teams left without a room (odd number)`);
			// In real tournaments, these would be bye rounds or pull-ups
		}

		return rooms;
	} catch (error) {
		throw new Error(`Error generating power-paired draw: ${error.message}`);
	}
};

/**
 * Allocate judges to rooms
 */
export const allocateJudges = async (rooms, tournamentId) => {
	try {
		// Get available judges for this tournament
		const tournament = await Tournament.findById(tournamentId).populate("judges");
		
		if (!tournament || !tournament.judges || tournament.judges.length === 0) {
			console.log("No judges available for allocation");
			return rooms;
		}

		// Populate judge profiles
		const judges = await User.find({
			_id: { $in: tournament.judges }
		}).populate("judgeProfile");

		// Sort judges by experience (assign experienced judges to top rooms)
		const judgesByExperience = {
			senior: judges.filter(j => j.judgeProfile?.experience === "senior"),
			experienced: judges.filter(j => j.judgeProfile?.experience === "experienced"),
			intermediate: judges.filter(j => j.judgeProfile?.experience === "intermediate"),
			novice: judges.filter(j => j.judgeProfile?.experience === "novice")
		};

		const judgePool = [
			...shuffleArray(judgesByExperience.senior),
			...shuffleArray(judgesByExperience.experienced),
			...shuffleArray(judgesByExperience.intermediate),
			...shuffleArray(judgesByExperience.novice)
		];

		if (judgePool.length === 0) {
			console.log("No judges with profiles available for allocation");
			return rooms;
		}

		let judgeIndex = 0;

		// Allocate judges to each room
		for (const room of rooms) {
			// Populate the room's teams to check for conflicts
			const populatedRoom = await DebateRoom.findById(room._id).populate("teams.team");
			if (!populatedRoom) continue;
			
			const roomTeams = populatedRoom.teams.map(t => t.team);
			const assignedJudges = [];

			// Try to assign at least 1 judge without conflicts
			let attempts = 0;
			const maxJudgesPerRoom = Math.min(3, judgePool.length); // Max 3 judges per room
			
			while (assignedJudges.length < maxJudgesPerRoom && attempts < judgePool.length * 2) {
				const judge = judgePool[judgeIndex % judgePool.length];
				
				// Check if judge already assigned to this room
				if (!assignedJudges.some(j => j.toString() === judge._id.toString())) {
					// Check for conflicts
					if (!hasConflict(judge, roomTeams)) {
						assignedJudges.push(judge._id);
					}
				}
				
				judgeIndex++;
				attempts++;
				
				// Break if we have at least 1 judge
				if (assignedJudges.length >= 1 && attempts > judgePool.length) {
					break;
				}
			}

			// Update room with judges
			populatedRoom.judges = assignedJudges;
			if (assignedJudges.length > 0) {
				populatedRoom.chair = assignedJudges[0]; // First judge is chair
			}
			
			await populatedRoom.save();
		}

		return rooms;
	} catch (error) {
		throw new Error(`Error allocating judges: ${error.message}`);
	}
};

/**
 * Main function to generate complete draw
 */
export const generateCompleteDraw = async (tournamentId, roundId, roundNumber, format) => {
	try {
		// Check if draw already exists
		const existingRooms = await DebateRoom.find({ round: roundId });
		if (existingRooms.length > 0) {
			throw new Error("Draw already exists for this round. Delete existing draw first.");
		}

		let rooms;
		
		if (roundNumber === 1) {
			rooms = await generateRound1Draw(tournamentId, roundId, format);
		} else {
			rooms = await generatePowerPairedDraw(tournamentId, roundId, format);
		}

		// Create rooms in database
		const createdRooms = await DebateRoom.insertMany(rooms);

		// Allocate judges
		await allocateJudges(createdRooms, tournamentId);

		// Fetch and return populated rooms
		const finalRooms = await DebateRoom.find({ round: roundId })
			.populate("teams.team")
			.populate("judges", "name institution judgeProfile");

		return finalRooms;
	} catch (error) {
		throw new Error(`Error generating draw: ${error.message}`);
	}
};
