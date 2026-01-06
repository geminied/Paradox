import {
	Box,
	VStack,
	HStack,
	Text,
	Table,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
	Badge,
	Avatar,
	useColorModeValue,
	Spinner,
	Center,
	Icon,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiAward } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const SpeakerStandings = ({ tournamentId }) => {
	const showToast = useShowToast();
	const [speakers, setSpeakers] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.600", "#888888");
	const headerBg = useColorModeValue("gray.50", "#0a0a0a");
	const goldColor = useColorModeValue("yellow.400", "yellow.500");
	const silverColor = useColorModeValue("gray.400", "gray.500");
	const bronzeColor = useColorModeValue("orange.400", "orange.500");

	useEffect(() => {
		fetchSpeakerStandings();
	}, [tournamentId]);

	const fetchSpeakerStandings = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/tournaments/${tournamentId}/speakers`);
			const data = await res.json();

			if (res.ok) {
				setSpeakers(data);
			} else {
				showToast("Error", data.error || "Failed to fetch speaker standings", "error");
			}
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const getMedalIcon = (rank) => {
		if (rank === 1) return { icon: "🥇", color: goldColor };
		if (rank === 2) return { icon: "🥈", color: silverColor };
		if (rank === 3) return { icon: "🥉", color: bronzeColor };
		return { icon: null, color: textColor };
	};

	if (isLoading) {
		return (
			<Center h="300px">
				<Spinner size="lg" color="blue.500" />
			</Center>
		);
	}

	if (!speakers || speakers.length === 0) {
		return (
			<Center h="300px">
				<VStack spacing={4}>
					<Icon as={FiAward} boxSize={12} color={mutedText} />
					<Text color={mutedText} fontSize="lg">
						No speaker data available yet
					</Text>
					<Text color={mutedText} fontSize="sm">
						Speaker standings will appear after debates are judged
					</Text>
				</VStack>
			</Center>
		);
	}

	return (
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
						<Th>Speaker</Th>
						<Th>Team</Th>
						<Th isNumeric>Avg Score</Th>
						<Th isNumeric>Total Score</Th>
						<Th isNumeric>Speeches</Th>
					</Tr>
				</Thead>
				<Tbody>
					{speakers.map((speaker, index) => {
						const rank = index + 1;
						const medal = getMedalIcon(rank);

						return (
							<Tr key={speaker._id} _hover={{ bg: headerBg }} transition="all 0.2s">
								<Td>
									<HStack spacing={2}>
										{medal.icon && <Text fontSize="xl">{medal.icon}</Text>}
										<Badge
											colorScheme={rank <= 3 ? "purple" : "gray"}
											borderRadius="full"
											fontSize="md"
											px={2}
										>
											{rank}
										</Badge>
									</HStack>
								</Td>
								<Td>
									<HStack spacing={3}>
										<Avatar
											size="sm"
											name={speaker.name}
											src={speaker.profilePic}
										/>
										<VStack align="start" spacing={0}>
											<Text fontWeight="bold" color={textColor}>
												{speaker.name}
											</Text>
											<Text fontSize="xs" color={mutedText}>
												@{speaker.username}
											</Text>
										</VStack>
									</HStack>
								</Td>
								<Td>
									<VStack align="start" spacing={0}>
										<Text fontSize="sm" color={textColor}>
											{speaker.team?.name}
										</Text>
										<Text fontSize="xs" color={mutedText}>
											{speaker.team?.institution}
										</Text>
									</VStack>
								</Td>
								<Td isNumeric>
									<Badge
										colorScheme={rank <= 3 ? "green" : "blue"}
										fontSize="lg"
										px={3}
										borderRadius="full"
									>
										{speaker.averageScore.toFixed(2)}
									</Badge>
								</Td>
								<Td isNumeric>
									<Text fontWeight="semibold" color={textColor}>
										{speaker.totalScore.toFixed(1)}
									</Text>
								</Td>
								<Td isNumeric>
									<Text fontSize="sm" color={mutedText}>
										{speaker.numSpeeches}
									</Text>
								</Td>
							</Tr>
						);
					})}
				</Tbody>
			</Table>

			{/* Top Speakers Highlight */}
			{speakers.length >= 3 && (
				<Box p={4} bg={headerBg} borderTop="1px" borderColor={borderColor}>
					<HStack spacing={2} justify="center">
						<Icon as={FiAward} color={goldColor} />
						<Text fontSize="sm" fontWeight="semibold" color={textColor}>
							Top Speaker: {speakers[0]?.name} ({speakers[0]?.averageScore.toFixed(2)} avg)
						</Text>
					</HStack>
				</Box>
			)}
		</Box>
	);
};

export default SpeakerStandings;
