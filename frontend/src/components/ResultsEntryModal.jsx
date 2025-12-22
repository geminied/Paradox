import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalBody,
	Box,
	Text,
	Button,
	Input,
	Select,
	Textarea,
	VStack,
	HStack,
	Divider,
	useColorModeValue,
	FormControl,
	FormLabel,
	IconButton,
	Badge,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiX, FiAward } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const ResultsEntryModal = ({ isOpen, onClose, debate, onResultsEntered }) => {
	const showToast = useShowToast();

	const [results, setResults] = useState(
		debate?.teams.map((teamInfo) => ({
			teamId: teamInfo.team._id,
			teamName: teamInfo.team.name,
			rank: null,
			points: null,
			speakerScores: teamInfo.team.members?.map((member) => ({
				speakerId: member._id,
				speakerName: member.name,
				score: null,
			})) || [],
		})) || []
	);
	const [feedback, setFeedback] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	const format = debate?.tournament?.format;
	const maxRank = format === "BP" ? 4 : 2;

	const handleRankChange = (teamIndex, rank) => {
		const newResults = [...results];
		const rankNum = parseInt(rank);
		newResults[teamIndex].rank = rankNum;

		// Auto-assign points based on rank (BP: 3,2,1,0; AP: 1,0)
		if (format === "BP") {
			newResults[teamIndex].points = rankNum === 1 ? 3 : rankNum === 2 ? 2 : rankNum === 3 ? 1 : 0;
		} else {
			newResults[teamIndex].points = rankNum === 1 ? 1 : 0;
		}

		setResults(newResults);
	};

	const handleSpeakerScoreChange = (teamIndex, speakerIndex, score) => {
		const newResults = [...results];
		newResults[teamIndex].speakerScores[speakerIndex].score = parseFloat(score);
		setResults(newResults);
	};

	const handleSubmit = async () => {
		// Validate all fields are filled
		for (const result of results) {
			if (result.rank === null || result.points === null) {
				showToast("Error", "Please assign ranks to all teams", "error");
				return;
			}
			for (const speaker of result.speakerScores) {
				if (speaker.score === null || isNaN(speaker.score)) {
					showToast("Error", "Please enter scores for all speakers", "error");
					return;
				}
			}
		}

		// Check for duplicate ranks
		const ranks = results.map(r => r.rank);
		if (new Set(ranks).size !== ranks.length) {
			showToast("Error", "Each team must have a unique rank", "error");
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch(`/api/debate-rooms/${debate._id}/results`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					results: results.map(r => ({
						teamId: r.teamId,
						rank: r.rank,
						points: r.points,
						speakerScores: r.speakerScores.map(s => ({
							speaker: s.speakerId,
							score: s.score,
						})),
					})),
					feedback,
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Results entered successfully!", "success");
			onResultsEntered && onResultsEntered(data);
			handleClose();
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		onClose();
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose} size="3xl">
			<ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
			<ModalContent bg={cardBg} borderRadius="3xl" border="1px" borderColor={borderColor} mx={4}>
				<ModalBody p={6}>
					<VStack align="stretch" spacing={4}>
						{/* Header */}
						<HStack justify="space-between">
							<HStack>
								<FiAward size={24} />
								<Text fontSize="xl" fontWeight="bold" color={textColor}>
									Enter Results
								</Text>
							</HStack>
							<IconButton
								icon={<FiX />}
								variant="ghost"
								onClick={handleClose}
								aria-label="Close"
								size="sm"
							/>
						</HStack>

						<Text fontSize="sm" color={mutedText}>
							{debate?.roomName} - {format} Format
						</Text>

						<Divider />

						{/* Results Entry */}
						<VStack align="stretch" spacing={4}>
							{results.map((result, teamIndex) => (
								<Box
									key={result.teamId}
									p={4}
									borderRadius="xl"
									border="1px"
									borderColor={borderColor}
								>
									<VStack align="stretch" spacing={3}>
										{/* Team Header */}
										<HStack justify="space-between">
											<Text fontWeight="bold" color={textColor}>
												{result.teamName}
											</Text>
											<Badge colorScheme="purple" variant="subtle">
												{debate.teams[teamIndex]?.position}
											</Badge>
										</HStack>

										{/* Rank */}
										<FormControl isRequired>
											<FormLabel fontSize="sm" color={textColor}>
												Rank
											</FormLabel>
											<Select
												value={result.rank || ""}
												onChange={(e) => handleRankChange(teamIndex, e.target.value)}
												placeholder="Select rank"
												color={textColor}
												borderColor={borderColor}
											>
												{Array.from({ length: maxRank }, (_, i) => (
													<option key={i + 1} value={i + 1}>
														{i + 1}
													</option>
												))}
											</Select>
										</FormControl>

										{/* Points (auto-calculated) */}
										<HStack>
											<Text fontSize="sm" color={mutedText}>
												Points:
											</Text>
											<Text fontSize="sm" fontWeight="bold" color={textColor}>
												{result.points !== null ? result.points : "-"}
											</Text>
										</HStack>

										{/* Speaker Scores */}
										<Box>
											<Text fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
												Speaker Scores
											</Text>
											<VStack spacing={2}>
												{result.speakerScores.map((speaker, speakerIndex) => (
													<FormControl key={speaker.speakerId} isRequired>
														<HStack>
															<Text fontSize="sm" flex={1} color={textColor}>
																{speaker.speakerName}
															</Text>
															<Input
																type="number"
																value={speaker.score || ""}
																onChange={(e) =>
																	handleSpeakerScoreChange(teamIndex, speakerIndex, e.target.value)
																}
																placeholder={format === "BP" ? "70-80" : "65-100"}
																width="100px"
																color={textColor}
																borderColor={borderColor}
															/>
														</HStack>
													</FormControl>
												))}
											</VStack>
										</Box>
									</VStack>
								</Box>
							))}
						</VStack>

						<Divider />

						{/* Feedback */}
						<FormControl>
							<FormLabel fontSize="sm" color={textColor}>
								Feedback (Optional)
							</FormLabel>
							<Textarea
								value={feedback}
								onChange={(e) => setFeedback(e.target.value)}
								placeholder="General feedback for all teams..."
								rows={3}
								color={textColor}
								borderColor={borderColor}
								_hover={{ borderColor: textColor }}
								_focus={{ borderColor: textColor }}
							/>
						</FormControl>

						{/* Action Buttons */}
						<HStack justify="flex-end">
							<Button variant="ghost" onClick={handleClose}>
								Cancel
							</Button>
							<Button
								colorScheme="blue"
								onClick={handleSubmit}
								isLoading={isLoading}
							>
								Submit Results
							</Button>
						</HStack>
					</VStack>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};

export default ResultsEntryModal;
