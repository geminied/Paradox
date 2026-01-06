/**
 * Break and Elimination Rounds Service
 * 
 * Handles:
 * - Break calculation (top N teams)
 * - Elimination bracket generation
 * - Quarterfinals, Semifinals, Grand Final draws
 * - Winner advancement logic
 */

import Team from "../models/teamModel.js";
import Tournament from "../models/tournamentModel.js";
import Round from "../models/roundModel.js";
import DebateRoom from "../models/debateRoomModel.js";
import { applyTieBreakers } from "../utils/tieBreakers.js";

/**
 * Calculate and announce the break
 * Returns top N teams based on tournament.breakingTeams setting
 */
export const calculateBreak = async (tournamentId) => {
	try {
		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}

		// Get all teams sorted by standings with tie-breakers applied
		const teams = await Team.find({ 
			tournament: tournamentId, 
			status: "confirmed" 
		})
			.populate("members", "name username")
			.populate("captain", "name username")
			.sort({ totalPoints: -1, totalSpeaks: -1 });

		if (teams.length === 0) {
			throw new Error("No teams found in tournament");
		}

		// Apply comprehensive tie-breakers
		const rankedTeams = await applyTieBreakers(teams, tournamentId);

		// Get breaking teams (top N)
		const breakSize = tournament.breakingTeams || 8;
		const breakingTeams = rankedTeams.slice(0, Math.min(breakSize, rankedTeams.length));

		// Mark teams as breaking
		for (let i = 0; i < breakingTeams.length; i++) {
			await Team.findByIdAndUpdate(breakingTeams[i]._id, {
				"teamBreaks.open": true
			});
		}

		return {
			breakingTeams,
			breakSize,
			totalTeams: rankedTeams.length,
			cutoffPoints: breakingTeams[breakingTeams.length - 1]?.totalPoints || 0,
			cutoffSpeaks: breakingTeams[breakingTeams.length - 1]?.totalSpeaks || 0
		};
	} catch (error) {
		console.error("Error in calculateBreak:", error.message);
		throw error;
	}
};

/**
 * Generate Quarterfinals draw
 * For BP: 8 teams → 2 rooms of 4 teams each
 * Seeding: 1v4v5v8 and 2v3v6v7
 */
export const generateQuarterfinals = async (tournamentId) => {
	try {
		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}

		// Get breaking teams (should already be marked)
		const breakingTeams = await Team.find({
			tournament: tournamentId,
			"teamBreaks.open": true
		})
			.populate("members", "name username")
			.sort({ totalPoints: -1, totalSpeaks: -1 });

		// Apply tie-breakers to ensure correct ranking
		const rankedTeams = await applyTieBreakers(breakingTeams, tournamentId);

		if (rankedTeams.length < 2) {
			throw new Error("Not enough teams for elimination rounds (minimum 2 required)");
		}

		// Determine round number (first elimination round after prelims)
		const lastRound = await Round.findOne({ tournament: tournamentId })
			.sort({ roundNumber: -1 });
		const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;

		// Create Quarterfinals Round
		const qfRound = await Round.create({
			tournament: tournamentId,
			roundNumber: roundNumber,
			roundType: "break",
			status: "scheduled",
			isDrawReleased: false
		});

		const debates = [];

		if (tournament.format === "BP") {
			if (rankedTeams.length === 2) {
				// Only 2 teams: Create a direct final
				const final = await DebateRoom.create({
					tournament: tournamentId,
					round: qfRound._id,
					roomName: "Grand Final",
					teams: [
						{ team: rankedTeams[0]._id, position: "OG", hasSubmitted: false },
						{ team: rankedTeams[1]._id, position: "OO", hasSubmitted: false },
						// Add dummy teams for BP format
						{ team: rankedTeams[0]._id, position: "CG", hasSubmitted: false },
						{ team: rankedTeams[1]._id, position: "CO", hasSubmitted: false }
					],
					status: "scheduled",
					prepDuration: 0.167,
					speechDuration: 0.5,
					currentSpeechNumber: 1,
					hasResults: false
				});
				debates.push(final);
				// Change round type to final
				qfRound.roundType = "final";
			} else if (rankedTeams.length === 3) {
				// Only 3 teams: Create a semi-final with 3 teams (one team gets bye to final)
				const semi = await DebateRoom.create({
					tournament: tournamentId,
					round: qfRound._id,
					roomName: "Semifinal",
					teams: [
						{ team: rankedTeams[0]._id, position: "OG", hasSubmitted: false },
						{ team: rankedTeams[1]._id, position: "OO", hasSubmitted: false },
						{ team: rankedTeams[2]._id, position: "CG", hasSubmitted: false },
						{ team: rankedTeams[0]._id, position: "CO", hasSubmitted: false } // Dummy
					],
					status: "scheduled",
					prepDuration: 0.167,
					speechDuration: 0.5,
					currentSpeechNumber: 1,
					hasResults: false
				});
				debates.push(semi);
				qfRound.roundType = "semi";
			} else if (rankedTeams.length >= 4 && rankedTeams.length < 8) {
				// 4-7 teams: Single quarterfinal/semifinal room
				const qf1 = await DebateRoom.create({
					tournament: tournamentId,
					round: qfRound._id,
					roomName: "Semifinal",
					teams: [
						{ team: rankedTeams[0]._id, position: "OG", hasSubmitted: false },
						{ team: rankedTeams[Math.min(3, rankedTeams.length - 1)]._id, position: "OO", hasSubmitted: false },
						{ team: rankedTeams[Math.min(1, rankedTeams.length - 1)]._id, position: "CG", hasSubmitted: false },
						{ team: rankedTeams[Math.min(2, rankedTeams.length - 1)]._id, position: "CO", hasSubmitted: false }
					],
					status: "scheduled",
					prepDuration: 0.167,
					speechDuration: 0.5,
					currentSpeechNumber: 1,
					hasResults: false
				});
				debates.push(qf1);
				qfRound.roundType = "semi";
			} else if (rankedTeams.length >= 8) {
				// BP Format: 8 teams → 2 rooms
				// QF Room 1: 1st, 4th, 5th, 8th
				const qf1 = await DebateRoom.create({
					tournament: tournamentId,
					round: qfRound._id,
					roomName: "Quarterfinal 1",
					teams: [
						{ team: rankedTeams[0]._id, position: "OG", hasSubmitted: false },
						{ team: rankedTeams[3]._id, position: "OO", hasSubmitted: false },
						{ team: rankedTeams[4]._id, position: "CG", hasSubmitted: false },
						{ team: rankedTeams[7]._id, position: "CO", hasSubmitted: false }
					],
					status: "scheduled",
					prepDuration: 0.167, // 10 seconds for testing
					speechDuration: 0.5, // 30 seconds for testing
					currentSpeechNumber: 1,
					hasResults: false
				});
				debates.push(qf1);

				// QF Room 2: 2nd, 3rd, 6th, 7th
				const qf2 = await DebateRoom.create({
					tournament: tournamentId,
					round: qfRound._id,
					roomName: "Quarterfinal 2",
					teams: [
						{ team: rankedTeams[1]._id, position: "OG", hasSubmitted: false },
						{ team: rankedTeams[2]._id, position: "OO", hasSubmitted: false },
						{ team: rankedTeams[5]._id, position: "CG", hasSubmitted: false },
						{ team: rankedTeams[6]._id, position: "CO", hasSubmitted: false }
					],
					status: "scheduled",
					prepDuration: 0.167,
					speechDuration: 0.5,
					currentSpeechNumber: 1,
					hasResults: false
				});
				debates.push(qf2);
			}
		}

		// Update round with debate references
		qfRound.debates = debates.map(d => d._id);
		qfRound.totalDebates = debates.length;
		await qfRound.save();

		return {
			round: qfRound,
			debates,
			message: `Generated ${debates.length} quarterfinal debate(s)`
		};
	} catch (error) {
		console.error("Error in generateQuarterfinals:", error.message);
		throw error;
	}
};

/**
 * Generate Semifinals draw
 * Gets top 2 teams from each QF room (4 teams total)
 */
export const generateSemifinals = async (tournamentId, qfRoundId) => {
	try {
		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}

		// Get QF round and verify it's completed
		const qfRound = await Round.findById(qfRoundId).populate("debates");
		if (!qfRound || qfRound.status !== "completed") {
			throw new Error("Quarterfinals must be completed first");
		}

		// Get all QF debates with results
		const qfDebates = await DebateRoom.find({
			round: qfRoundId,
			hasResults: true
		}).populate({
			path: "teams.team",
			populate: { path: "members captain" }
		});

		if (qfDebates.length === 0) {
			throw new Error("No completed quarterfinal debates found");
		}

		// Extract advancing teams (top 2 from each room)
		const advancingTeams = [];
		for (const debate of qfDebates) {
			// Sort teams by rank (1st and 2nd advance)
			const sortedTeams = [...debate.teams].sort((a, b) => (a.rank || 99) - (b.rank || 99));
			advancingTeams.push(sortedTeams[0], sortedTeams[1]);
		}

		if (advancingTeams.length < 4) {
			throw new Error("Not enough teams advanced from quarterfinals");
		}

		// Determine round number
		const lastRound = await Round.findOne({ tournament: tournamentId })
			.sort({ roundNumber: -1 });
		const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;

		// Create Semifinals Round
		const sfRound = await Round.create({
			tournament: tournamentId,
			roundNumber: roundNumber,
			roundType: "semi",
			status: "scheduled",
			isDrawReleased: false
		});

		// Create one debate with all 4 teams (BP format)
		const sfDebate = await DebateRoom.create({
			tournament: tournamentId,
			round: sfRound._id,
			roomName: "Semifinal",
			teams: [
				{ team: advancingTeams[0].team._id, position: "OG", hasSubmitted: false },
				{ team: advancingTeams[1].team._id, position: "OO", hasSubmitted: false },
				{ team: advancingTeams[2].team._id, position: "CG", hasSubmitted: false },
				{ team: advancingTeams[3].team._id, position: "CO", hasSubmitted: false }
			],
			status: "scheduled",
			prepDuration: 0.167,
			speechDuration: 0.5,
			currentSpeechNumber: 1,
			hasResults: false
		});

		// Update round
		sfRound.debates = [sfDebate._id];
		sfRound.totalDebates = 1;
		await sfRound.save();

		return {
			round: sfRound,
			debates: [sfDebate],
			advancingTeams: advancingTeams.map(t => t.team),
			message: "Semifinals generated successfully"
		};
	} catch (error) {
		console.error("Error in generateSemifinals:", error.message);
		throw error;
	}
};

/**
 * Generate Grand Final
 * Gets top 2-4 teams from semifinals
 */
export const generateGrandFinal = async (tournamentId, sfRoundId) => {
	try {
		const tournament = await Tournament.findById(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}

		// Get SF round and verify it's completed
		const sfRound = await Round.findById(sfRoundId).populate("debates");
		if (!sfRound || sfRound.status !== "completed") {
			throw new Error("Semifinals must be completed first");
		}

		// Get SF debate with results
		const sfDebate = await DebateRoom.findOne({
			round: sfRoundId,
			hasResults: true
		}).populate({
			path: "teams.team",
			populate: { path: "members captain" }
		});

		if (!sfDebate) {
			throw new Error("No completed semifinal debate found");
		}

		// Sort teams by rank - all 4 teams go to Grand Final
		const sortedTeams = [...sfDebate.teams].sort((a, b) => (a.rank || 99) - (b.rank || 99));

		if (sortedTeams.length < 4) {
			throw new Error("Not enough teams in semifinals");
		}

		// Determine round number
		const lastRound = await Round.findOne({ tournament: tournamentId })
			.sort({ roundNumber: -1 });
		const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;

		// Create Grand Final Round
		const gfRound = await Round.create({
			tournament: tournamentId,
			roundNumber: roundNumber,
			roundType: "final",
			status: "scheduled",
			isDrawReleased: false
		});

		// Create Grand Final debate with all 4 teams (BP format)
		const gfDebate = await DebateRoom.create({
			tournament: tournamentId,
			round: gfRound._id,
			roomName: "Grand Final",
			teams: [
				{ team: sortedTeams[0].team._id, position: "OG", hasSubmitted: false },
				{ team: sortedTeams[1].team._id, position: "OO", hasSubmitted: false },
				{ team: sortedTeams[2].team._id, position: "CG", hasSubmitted: false },
				{ team: sortedTeams[3].team._id, position: "CO", hasSubmitted: false }
			],
			status: "scheduled",
			prepDuration: 0.167,
			speechDuration: 0.5,
			currentSpeechNumber: 1,
			hasResults: false
		});

		// Update round
		gfRound.debates = [gfDebate._id];
		gfRound.totalDebates = 1;
		await gfRound.save();

		return {
			round: gfRound,
			debate: gfDebate,
			finalists: sortedTeams.map(t => t.team),
			message: "Grand Final generated successfully"
		};
	} catch (error) {
		console.error("Error in generateGrandFinal:", error.message);
		throw error;
	}
};

/**
 * Get elimination bracket structure
 * Returns complete bracket with all rounds and results
 */
export const getEliminationBracket = async (tournamentId) => {
	try {
		// Get all elimination rounds
		const eliminationRounds = await Round.find({
			tournament: tournamentId,
			roundType: { $in: ["break", "semi", "final"] }
		})
			.populate({
				path: "debates",
				populate: {
					path: "teams.team",
					populate: { path: "members captain" }
				}
			})
			.sort({ roundNumber: 1 });

		const bracket = {
			quarterfinals: null,
			semifinals: null,
			grandFinal: null,
			champion: null
		};

		for (const round of eliminationRounds) {
			const roundData = {
				round: {
					_id: round._id,
					roundNumber: round.roundNumber,
					roundType: round.roundType,
					status: round.status,
					isDrawReleased: round.isDrawReleased
				},
				debates: round.debates
			};

			if (round.roundType === "break") {
				bracket.quarterfinals = roundData;
			} else if (round.roundType === "semi") {
				bracket.semifinals = roundData;
			} else if (round.roundType === "final") {
				bracket.grandFinal = roundData;
				
				// Determine champion if final is completed
				if (round.status === "completed" && round.debates.length > 0) {
					const finalDebate = round.debates[0];
					if (finalDebate.hasResults && finalDebate.teams.length > 0) {
						const winner = finalDebate.teams.find(t => t.rank === 1);
						if (winner) {
							bracket.champion = winner.team;
						}
					}
				}
			}
		}

		return bracket;
	} catch (error) {
		console.error("Error in getEliminationBracket:", error.message);
		throw error;
	}
};

/**
 * Complete tournament and set champion
 */
export const completeTournament = async (tournamentId) => {
	try {
		const bracket = await getEliminationBracket(tournamentId);
		
		if (!bracket.champion) {
			throw new Error("Cannot complete tournament without a champion");
		}

		await Tournament.findByIdAndUpdate(tournamentId, {
			status: "completed"
		});

		return {
			champion: bracket.champion,
			message: "Tournament completed successfully"
		};
	} catch (error) {
		console.error("Error in completeTournament:", error.message);
		throw error;
	}
};
