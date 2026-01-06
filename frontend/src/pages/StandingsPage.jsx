import {
	Box,
	VStack,
	HStack,
	Heading,
	Text,
	Table,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
	Badge,
	useColorModeValue,
	Tabs,
	TabList,
	TabPanels,
	Tab,
	TabPanel,
	Spinner,
	Center,
	Divider,
	Tooltip,
	Icon,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FiTrendingUp, FiAward, FiInfo } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";
import SpeakerStandings from "../components/SpeakerStandings";

const StandingsPage = ({ tournamentId }) => {
	const { id } = useParams();
	const tournamentIdToUse = tournamentId || id;
	const showToast = useShowToast();
	const [standings, setStandings] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.600", "#888888");
	const goldBg = useColorModeValue("yellow.50", "#2a2a00");
	const silverBg = useColorModeValue("gray.100", "#1a1a1a");
	const bronzeBg = useColorModeValue("orange.50", "#2a1a00");
	const headerBg = useColorModeValue("gray.50", "#0a0a0a");

	useEffect(() => {
		if (tournamentIdToUse) {
			fetchStandings();
		}
	}, [tournamentIdToUse]);

	const fetchStandings = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/tournaments/${tournamentIdToUse}/standings`);
			const data = await res.json();

			if (res.ok) {
				setStandings(data);
			} else {
				showToast("Error", data.error || "Failed to fetch standings", "error");
			}
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const getRankBadge = (rank) => {
		if (rank === 1) return { icon: "🥇", color: "yellow", bg: goldBg };
		if (rank === 2) return { icon: "🥈", color: "gray", bg: silverBg };
		if (rank === 3) return { icon: "🥉", color: "orange", bg: bronzeBg };
		return { icon: null, color: "blue", bg: cardBg };
	};

	if (isLoading) {
		return (
			<Center h="400px">
				<Spinner size="xl" color="blue.500" />
			</Center>
		);
	}

	if (!standings || standings.length === 0) {
		return (
			<Center h="400px">
				<VStack spacing={4}>
					<Icon as={FiTrendingUp} boxSize={12} color={mutedText} />
					<Text color={mutedText} fontSize="lg">
						No standings available yet
					</Text>
					<Text color={mutedText} fontSize="sm">
						Standings will appear after the first round is completed
					</Text>
				</VStack>
			</Center>
		);
	}

	return (
		<Box maxW="1200px" mx="auto" py={8} px={4}>
			<VStack align="stretch" spacing={6}>
				{/* Header */}
				<HStack spacing={3} mb={4}>
					<FiTrendingUp size={28} />
					<Heading size="lg">Tournament Standings</Heading>
					<Badge colorScheme="blue" fontSize="md" borderRadius="full" px={3}>
						{standings.length} Teams
					</Badge>
				</HStack>

				<Tabs colorScheme="blue" variant="soft-rounded">
					<TabList mb={4}>
						<Tab>Team Standings</Tab>
						<Tab>Speaker Rankings</Tab>
					</TabList>

					<TabPanels>
						{/* Team Standings */}
						<TabPanel p={0}>
							<Box
								bg={cardBg}
								border="1px"
								borderColor={borderColor}
								borderRadius="xl"
								overflow="hidden"
							>
								<Table variant="simple">
									<Thead bg={headerBg}>
										<Tr>
											<Th>Rank</Th>
											<Th>Team</Th>
											<Th>Institution</Th>
											<Th isNumeric>Points</Th>
											<Th isNumeric>Total Speaks</Th>
											<Th>Record</Th>
											<Th>Tie-Breaker</Th>
										</Tr>
									</Thead>
									<Tbody>
										{standings.map((team, index) => {
											const rankInfo = getRankBadge(team.finalRank || index + 1);
											return (
												<Tr
													key={team._id}
													bg={rankInfo.bg}
													_hover={{ opacity: 0.8 }}
													transition="all 0.2s"
												>
													<Td>
														<HStack spacing={2}>
															{rankInfo.icon && (
																<Text fontSize="xl">{rankInfo.icon}</Text>
															)}
															<Badge
																colorScheme={rankInfo.color}
																borderRadius="full"
																fontSize="md"
																px={2}
															>
																{team.finalRank || index + 1}
															</Badge>
														</HStack>
													</Td>
													<Td>
														<Text fontWeight="bold" color={textColor}>
															{team.name}
														</Text>
													</Td>
													<Td>
														<Text fontSize="sm" color={mutedText}>
															{team.institution || "N/A"}
														</Text>
													</Td>
													<Td isNumeric>
														<Badge colorScheme="green" fontSize="lg" px={3}>
															{team.totalPoints || 0}
														</Badge>
													</Td>
													<Td isNumeric>
														<Text fontWeight="semibold" color={textColor}>
															{team.totalSpeaks?.toFixed(1) || "0.0"}
														</Text>
													</Td>
													<Td>
														<Text fontSize="sm" color={mutedText}>
															{team.wins || 0}W - {team.losses || 0}L
														</Text>
													</Td>
													<Td>
														{team.tieInfo ? (
															<Tooltip label={team.tieInfo} placement="top">
																<HStack spacing={1} cursor="help">
																	<Icon as={FiInfo} color="blue.500" />
																	<Text fontSize="xs" color={mutedText}>
																		{team.tieInfo.substring(0, 20)}
																		{team.tieInfo.length > 20 ? "..." : ""}
																	</Text>
																</HStack>
															</Tooltip>
														) : (
															<Text fontSize="xs" color={mutedText}>
																—
															</Text>
														)}
													</Td>
												</Tr>
											);
										})}
									</Tbody>
								</Table>
							</Box>

							{/* Tie-Breaker Explanation */}
							<Box mt={6} p={4} bg={headerBg} borderRadius="lg">
								<Text fontSize="sm" fontWeight="semibold" mb={2}>
									Tie-Breaking Rules (in order):
								</Text>
								<VStack align="start" spacing={1} fontSize="xs" color={mutedText}>
									<Text>1. Total Points</Text>
									<Text>2. Total Speaker Scores</Text>
									<Text>3. Head-to-Head Result (if teams met)</Text>
									<Text>4. Number of 1st Place Finishes</Text>
									<Text>5. Number of 2nd Place Finishes</Text>
									<Text>6. Random (Coin Toss)</Text>
								</VStack>
							</Box>
						</TabPanel>

						{/* Speaker Standings */}
						<TabPanel p={0}>
							<SpeakerStandings tournamentId={tournamentIdToUse} />
						</TabPanel>
					</TabPanels>
				</Tabs>
			</VStack>
		</Box>
	);
};

export default StandingsPage;
