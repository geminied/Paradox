import {
	Box,
	Text,
	VStack,
	HStack,
	Badge,
	useColorModeValue,
	Divider,
	Table,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
	Button,
	Heading,
	Accordion,
	AccordionItem,
	AccordionButton,
	AccordionPanel,
	AccordionIcon,
	Tabs,
	TabList,
	TabPanels,
	Tab,
	TabPanel,
} from "@chakra-ui/react";
import { FiAward, FiTrendingUp, FiFileText, FiMessageSquare } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useShowToast from "../hooks/useShowToast";

const DebateResults = ({ debate, currentUser }) => {
	const navigate = useNavigate();
	const showToast = useShowToast();
	const [ballots, setBallots] = useState([]);
	const [isLoadingBallots, setIsLoadingBallots] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const highlightBg = useColorModeValue("yellow.50", "#2a2a00");
	const goldBg = useColorModeValue("yellow.100", "#3a3a00");
	const silverBg = useColorModeValue("gray.100", "#1a1a1a");
	const bronzeBg = useColorModeValue("orange.100", "#2a1a00");
	const feedbackBg = useColorModeValue("blue.50", "#0a1a2a");

	useEffect(() => {
		if (debate && debate.hasResults) {
			fetchBallots();
		}
	}, [debate?._id]);

	const fetchBallots = async () => {
		setIsLoadingBallots(true);
		try {
			const res = await fetch(`/api/ballots/debate/${debate._id}`);
			const data = await res.json();
			if (res.ok) {
				setBallots(data);
			}
		} catch (error) {
			console.error("Error fetching ballots:", error);
		} finally {
			setIsLoadingBallots(false);
		}
	};

	if (!debate || !debate.hasResults) {
		return null;
	}

	// Sort teams by rank
	const sortedTeams = [...debate.teams].sort((a, b) => (a.rank || 999) - (b.rank || 999));

	const getRankBadge = (rank) => {
		const badges = {
			1: { label: "1st Place", colorScheme: "yellow", icon: "🥇" },
			2: { label: "2nd Place", colorScheme: "gray", icon: "🥈" },
			3: { label: "3rd Place", colorScheme: "orange", icon: "🥉" },
			4: { label: "4th Place", colorScheme: "red", icon: "" },
		};
		return badges[rank] || { label: `${rank}th`, colorScheme: "gray", icon: "" };
	};

	const getRankBg = (rank) => {
		switch (rank) {
			case 1: return goldBg;
			case 2: return silverBg;
			case 3: return bronzeBg;
			default: return cardBg;
		}
	};

	const isJudge = debate.judges?.some(j => j._id === currentUser?._id) || 
				   debate.chair?._id === currentUser?._id;
	const isCreator = debate.tournament?.creator === currentUser?._id;

	return (
		<Box
			bg={cardBg}
			border="1px"
			borderColor={borderColor}
			borderRadius="3xl"
			p={6}
		>
			<VStack align="stretch" spacing={6}>
				<HStack spacing={3}>
					<FiAward size={24} color="#FFD700" />
					<Heading size="md">Debate Results</Heading>
					<Badge colorScheme="green" variant="solid" borderRadius="full">
						FINAL
					</Badge>
				</HStack>

				<Divider />

				{/* Team Rankings */}
				<Box>
					<Text fontWeight="semibold" mb={4} fontSize="lg">
						Team Rankings
					</Text>
					<VStack spacing={3} align="stretch">
						{sortedTeams.map((teamData) => {
							const rankInfo = getRankBadge(teamData.rank);
							return (
								<Box
									key={teamData.team._id}
									p={4}
									borderRadius="xl"
									bg={getRankBg(teamData.rank)}
									border="2px"
									borderColor={teamData.rank === 1 ? "yellow.400" : borderColor}
									position="relative"
								>
									<HStack justify="space-between" align="start">
										<VStack align="start" spacing={1} flex={1}>
											<HStack spacing={2}>
												<Text fontSize="2xl">{rankInfo.icon}</Text>
												<Badge 
													colorScheme={rankInfo.colorScheme} 
													variant="solid" 
													borderRadius="full"
													px={3}
												>
													{rankInfo.label}
												</Badge>
											</HStack>
											<Text fontWeight="bold" fontSize="lg" color={textColor}>
												{teamData.team.name}
											</Text>
											<Text fontSize="sm" color={mutedText}>
												{teamData.position} • {teamData.team.institution}
											</Text>
										</VStack>
										<VStack align="end" spacing={1}>
											<HStack>
												<FiTrendingUp />
												<Text fontWeight="bold" fontSize="2xl" color={textColor}>
													{teamData.points}
												</Text>
												<Text fontSize="sm" color={mutedText}>pts</Text>
											</HStack>
											<Text fontSize="sm" color={mutedText}>
												{teamData.totalSpeaks?.toFixed(1) || 0} speaks
											</Text>
										</VStack>
									</HStack>

									{/* Speaker Scores */}
									{teamData.speakerScores && teamData.speakerScores.length > 0 && (
										<Box mt={3} pt={3} borderTop="1px" borderColor={borderColor}>
											<Text fontSize="xs" color={mutedText} mb={2}>
												Speaker Scores:
											</Text>
											<VStack spacing={1} align="stretch">
												{teamData.speakerScores.map((ss, idx) => (
													<HStack key={idx} justify="space-between" fontSize="sm">
														<Text color={textColor}>
															{ss.speaker?.name || `Speaker ${idx + 1}`}
														</Text>
														<Badge colorScheme="blue" borderRadius="full">
															{ss.score?.toFixed(1) || 0}
														</Badge>
													</HStack>
												))}
											</VStack>
										</Box>
									)}
								</Box>
							);
						})}
					</VStack>
				</Box>

				<Divider />

				{/* Judge Feedback Section */}
				{ballots && ballots.length > 0 && (
					<Box>
						<HStack spacing={3} mb={4}>
							<FiMessageSquare size={20} />
							<Heading size="md">Judge Feedback</Heading>
							<Badge colorScheme="purple">{ballots.length} Judge{ballots.length > 1 ? 's' : ''}</Badge>
						</HStack>

						<Tabs colorScheme="blue" variant="soft-rounded">
							<TabList mb={4}>
								<Tab>By Team</Tab>
								<Tab>Overall Comments</Tab>
							</TabList>

							<TabPanels>
								{/* Team-specific feedback */}
								<TabPanel p={0}>
									<VStack spacing={4} align="stretch">
										{sortedTeams.map((teamData) => {
											// Collect all feedback for this team from all judges
											const teamFeedbackList = ballots.flatMap(ballot => 
												ballot.teamFeedback?.filter(tf => 
													tf.team?._id === teamData.team._id || 
													tf.team === teamData.team._id
												) || []
											);

											if (teamFeedbackList.length === 0) return null;

											return (
												<Box
													key={teamData.team._id}
													p={4}
													bg={feedbackBg}
													borderRadius="xl"
													border="1px"
													borderColor={borderColor}
												>
													<Text fontWeight="bold" mb={3} fontSize="lg">
														{teamData.team.name} ({teamData.position})
													</Text>
													
													<Accordion allowMultiple>
														{teamFeedbackList.map((feedback, idx) => {
															const judge = ballots[idx]?.judge;
															const hasContent = feedback.strengths || feedback.weaknesses || feedback.advice;
															
															if (!hasContent) return null;

															return (
																<AccordionItem key={idx} border="none" mb={2}>
																	<AccordionButton
																		bg={cardBg}
																		borderRadius="lg"
																		_hover={{ bg: highlightBg }}
																	>
																		<Box flex="1" textAlign="left">
																			<Text fontSize="sm" fontWeight="semibold">
																				Judge {idx + 1}
																				{isCreator && judge && ` - ${judge.name}`}
																			</Text>
																		</Box>
																		<AccordionIcon />
																	</AccordionButton>
																	<AccordionPanel pb={4}>
																		<VStack align="stretch" spacing={3}>
																			{feedback.strengths && (
																				<Box>
																					<Text fontSize="xs" color="green.500" fontWeight="semibold" mb={1}>
																						✓ STRENGTHS
																					</Text>
																					<Text fontSize="sm" color={textColor}>
																						{feedback.strengths}
																					</Text>
																				</Box>
																			)}
																			{feedback.weaknesses && (
																				<Box>
																					<Text fontSize="xs" color="orange.500" fontWeight="semibold" mb={1}>
																						⚠ AREAS TO IMPROVE
																					</Text>
																					<Text fontSize="sm" color={textColor}>
																						{feedback.weaknesses}
																					</Text>
																				</Box>
																			)}
																			{feedback.advice && (
																				<Box>
																					<Text fontSize="xs" color="blue.500" fontWeight="semibold" mb={1}>
																						💡 ADVICE
																					</Text>
																					<Text fontSize="sm" color={textColor}>
																						{feedback.advice}
																					</Text>
																				</Box>
																			)}
																		</VStack>
																	</AccordionPanel>
																</AccordionItem>
															);
														})}
													</Accordion>
												</Box>
											);
										})}
									</VStack>
								</TabPanel>

								{/* Overall comments from judges */}
								<TabPanel p={0}>
									<VStack spacing={3} align="stretch">
										{ballots.map((ballot, idx) => {
											const judge = ballot.judge;
											const hasOverall = ballot.overallFeedback && ballot.overallFeedback.trim();
											
											if (!hasOverall) return null;

											return (
												<Box
													key={ballot._id}
													p={4}
													bg={feedbackBg}
													borderRadius="xl"
													border="1px"
													borderColor={borderColor}
												>
													<HStack spacing={2} mb={2}>
														<Badge colorScheme="purple" borderRadius="full">
															Judge {idx + 1}
															{isCreator && judge && ` - ${judge.name}`}
														</Badge>
													</HStack>
													<Text fontSize="sm" color={textColor}>
														{ballot.overallFeedback}
													</Text>
												</Box>
											);
										})}
										{ballots.every(b => !b.overallFeedback || !b.overallFeedback.trim()) && (
											<Text fontSize="sm" color={mutedText} textAlign="center" py={4}>
												No overall comments provided
											</Text>
										)}
									</VStack>
								</TabPanel>
							</TabPanels>
						</Tabs>

						{/* Judge Actions */}
						{(isJudge || isCreator) && (
							<Box mt={6} pt={4} borderTop="1px" borderColor={borderColor}>
								<HStack spacing={3}>
									{isJudge && (
										<Button
											leftIcon={<FiFileText />}
											size="sm"
											variant="outline"
											onClick={() => navigate(`/ballot/${debate._id}`)}
										>
											View My Ballot
										</Button>
									)}
									{isCreator && (
										<Button
											leftIcon={<FiFileText />}
											size="sm"
											colorScheme="purple"
											variant="outline"
											onClick={() => {
												// Could navigate to a page showing all ballots
												alert("View all ballots - to be implemented");
											}}
										>
											View All Ballots
										</Button>
									)}
								</HStack>
							</Box>
						)}
					</Box>
				)}

				{/* No Feedback Available Message */}
				{(!ballots || ballots.length === 0) && (
					<Box textAlign="center" py={4}>
						<HStack justify="center" spacing={2}>
							<FiMessageSquare />
							<Text fontSize="sm" color={mutedText}>
								Judge feedback will appear here once available
							</Text>
						</HStack>
						{(isJudge || isCreator) && (
							<HStack justify="center" mt={4} spacing={3}>
								{isJudge && (
									<Button
										leftIcon={<FiFileText />}
										size="sm"
										variant="outline"
										onClick={() => navigate(`/ballot/${debate._id}`)}
									>
										Submit My Ballot
									</Button>
								)}
							</HStack>
						)}
					</Box>
				)}
			</VStack>
		</Box>
	);
};

export default DebateResults;
