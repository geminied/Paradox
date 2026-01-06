/**
 * Tie-Breaking System for Tournament Standings
 * 
 * Applies cascading tie-breakers to rank teams with equal points:
 * 1. Total Points (primary)
 * 2. Total Speaker Scores
 * 3. Head-to-Head Result (if teams met)
 * 4. Number of 1st Places
 * 5. Number of 2nd Places
 * 6. Coin Toss (random)
 */

import DebateRoom from "../models/debateRoomModel.js";
import Tournament from "../models/tournamentModel.js";

/**
 * Apply comprehensive tie-breaking rules to teams
 * @param {Array} teams - Array of team objects with stats
 * @param {String} tournamentId - Tournament ID for fetching debate history
 * @returns {Array} - Ranked teams with tie-breaker details
 */
export const applyTieBreakers = async (teams, tournamentId) => {
	if (!teams || teams.length === 0) return [];

	// Fetch tournament for format info
	const tournament = await Tournament.findById(tournamentId);
	if (!tournament) return teams;

	// Fetch all debates for head-to-head and placement analysis
	const debates = await DebateRoom.find({ 
		tournament: tournamentId,
		hasResults: true 
	}).populate('teams');

	// Calculate extended stats for each team
	const teamsWithStats = teams.map(team => {
		const teamStats = calculateTeamStats(team, debates, tournament.format);
		return {
			...team.toObject(),
			...teamStats,
			tieInfo: null // Will be populated if tied
		};
	});

	// Group teams by points
	const pointGroups = {};
	teamsWithStats.forEach(team => {
		const points = team.totalPoints || 0;
		if (!pointGroups[points]) {
			pointGroups[points] = [];
		}
		pointGroups[points].push(team);
	});

	// Apply tie-breakers within each point group
	const rankedTeams = [];
	const sortedPoints = Object.keys(pointGroups).sort((a, b) => b - a);

	sortedPoints.forEach(points => {
		const group = pointGroups[points];
		
		if (group.length === 1) {
			// No tie, just add
			rankedTeams.push(group[0]);
		} else {
			// Apply tie-breaking cascade
			const sorted = breakTies(group, debates);
			rankedTeams.push(...sorted);
		}
	});

	// Assign final ranks
	rankedTeams.forEach((team, index) => {
		team.finalRank = index + 1;
	});

	return rankedTeams;
};

/**
 * Calculate extended statistics for a team
 */
function calculateTeamStats(team, debates, tournamentFormat) {
	let firstPlaces = 0;
	let secondPlaces = 0;
	let thirdPlaces = 0;
	let fourthPlaces = 0;
	let wins = 0;
	let losses = 0;

	debates.forEach(debate => {
		// Check if this team participated
		const teamId = team._id.toString();
		const teamInDebate = debate.teams.find(t => 
			t.team?._id?.toString() === teamId || t.team?.toString() === teamId
		);

		if (teamInDebate) {
			const rank = teamInDebate.rank;
			
			if (rank === 1) {
				firstPlaces++;
				wins++;
			} else if (rank === 2) {
				secondPlaces++;
				if (tournamentFormat === 'AP') {
					losses++; // In AP, 2nd place = loss
				} else {
					wins++; // In BP, 2nd place = still a win (gets 2 points)
				}
			} else if (rank === 3) {
				thirdPlaces++;
				losses++;
			} else if (rank === 4) {
				fourthPlaces++;
				losses++;
			}
		}
	});

	return {
		firstPlaces,
		secondPlaces,
		thirdPlaces,
		fourthPlaces,
		wins,
		losses,
		totalDebates: wins + losses
	};
}

/**
 * Break ties using cascading rules
 */
function breakTies(group, debates) {
	// Start with all teams in the group
	let remaining = [...group];

	// Rule 2: Total Speaker Scores (already sorted in query, but re-check)
	remaining.sort((a, b) => {
		const speaksDiff = (b.totalSpeaks || 0) - (a.totalSpeaks || 0);
		if (speaksDiff !== 0) {
			if (Math.abs(speaksDiff) > 0.1) { // Not tied on speaks
				if (speaksDiff > 0) b.tieInfo = "Higher speaker scores";
				else a.tieInfo = "Higher speaker scores";
			}
			return speaksDiff;
		}

		// Rule 3: Head-to-Head (if they met)
		const h2h = getHeadToHeadResult(a, b, debates);
		if (h2h !== 0) {
			if (h2h > 0) {
				a.tieInfo = `Beat ${b.name} head-to-head`;
			} else {
				b.tieInfo = `Beat ${a.name} head-to-head`;
			}
			return h2h;
		}

		// Rule 4: Number of 1st places
		const firstDiff = (b.firstPlaces || 0) - (a.firstPlaces || 0);
		if (firstDiff !== 0) {
			if (firstDiff > 0) {
				b.tieInfo = `More 1st places (${b.firstPlaces} vs ${a.firstPlaces})`;
			} else {
				a.tieInfo = `More 1st places (${a.firstPlaces} vs ${b.firstPlaces})`;
			}
			return firstDiff;
		}

		// Rule 5: Number of 2nd places
		const secondDiff = (b.secondPlaces || 0) - (a.secondPlaces || 0);
		if (secondDiff !== 0) {
			if (secondDiff > 0) {
				b.tieInfo = `More 2nd places (${b.secondPlaces} vs ${a.secondPlaces})`;
			} else {
				a.tieInfo = `More 2nd places (${a.secondPlaces} vs ${b.secondPlaces})`;
			}
			return secondDiff;
		}

		// Rule 6: Coin toss (random)
		const coinFlip = Math.random() - 0.5;
		if (coinFlip !== 0) {
			a.tieInfo = "Coin toss";
			b.tieInfo = "Coin toss";
		}
		return coinFlip;
	});

	return remaining;
}

/**
 * Get head-to-head result if teams met
 * Returns: 1 if teamA won, -1 if teamB won, 0 if they didn't meet or tied
 */
function getHeadToHeadResult(teamA, teamB, debates) {
	const teamAId = teamA._id.toString();
	const teamBId = teamB._id.toString();

	// Find debate where both teams participated
	const h2hDebate = debates.find(debate => {
		const participantIds = debate.teams.map(t => 
			(t.team?._id || t.team)?.toString()
		);
		return participantIds.includes(teamAId) && participantIds.includes(teamBId);
	});

	if (!h2hDebate) return 0; // Didn't meet

	// Find ranks
	const teamAData = h2hDebate.teams.find(t => 
		(t.team?._id || t.team)?.toString() === teamAId
	);
	const teamBData = h2hDebate.teams.find(t => 
		(t.team?._id || t.team)?.toString() === teamBId
	);

	if (!teamAData || !teamBData) return 0;

	const rankA = teamAData.rank || 999;
	const rankB = teamBData.rank || 999;

	if (rankA < rankB) return 1; // A ranked higher = A won
	if (rankB < rankA) return -1; // B ranked higher = B won
	return 0; // Same rank (shouldn't happen)
}

export default applyTieBreakers;
