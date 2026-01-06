import {
	Box,
	VStack,
	HStack,
	Heading,
	Text,
	Button,
	Table,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
	Badge,
	useColorModeValue,
	Spinner,
	Center,
	Icon,
	Divider,
	Alert,
	AlertIcon,
	AlertTitle,
	AlertDescription,
	useDisclosure,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FiAward, FiCheckCircle } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";
import EliminationBracket from "../components/EliminationBracket";

const BreakPage = ({ tournamentId, tournament, isOrganizer }) => {
	const { id } = useParams();
	const tournamentIdToUse = tournamentId || id;
	const showToast = useShowToast();

	const [breakData, setBreakData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isAnnouncing, setIsAnnouncing] = useState(false);
	const [bracket, setBracket] = useState(null);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.600", "#888888");
	const headerBg = useColorModeValue("gray.50", "#0a0a0a");
	const goldBg = useColorModeValue("yellow.50", "#2a2a00");
	const successBg = useColorModeValue("green.50", "#002a00");

	useEffect(() => {
		if (tournamentIdToUse) {
			fetchBracket();
		}
	}, [tournamentIdToUse]);

	const fetchBracket = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/tournaments/${tournamentIdToUse}/break/bracket`);
			const data = await res.json();

			if (res.ok) {
				setBracket(data);
				// If bracket exists, extract breaking teams
				if (data.quarterfinals || data.semifinals || data.grandFinal) {
					setBreakData({ breakingTeams: extractBreakingTeams(data) });
				}
			} else {
				// Break not announced yet
				setBracket(null);
			}
		} catch (error) {
			console.error("Error fetching bracket:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const extractBreakingTeams = (bracket) => {
		const teams = [];
		if (bracket.quarterfinals?.debates) {
			bracket.quarterfinals.debates.forEach(debate => {
				debate.teams.forEach(t => {
					if (t.team && !teams.find(team => team._id === t.team._id)) {
						teams.push(t.team);
					}
				});
			});
		}
		return teams;
	};

	const handleAnnounceBreak = async () => {
		setIsAnnouncing(true);
		try {
			const res = await fetch(`/api/tournaments/${tournamentIdToUse}/break/announce`, {
				method: "POST",
				headers: { "Content-Type": "application/json" }
			});
			const data = await res.json();

			if (res.ok) {
				setBreakData(data);
				showToast("Success", "Break announced successfully! 🎉", "success");
			} else {
				showToast("Error", data.error || "Failed to announce break", "error");
			}
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsAnnouncing(false);
		}
	};

	const handleGenerateQuarterfinals = async () => {
		try {
			const res = await fetch(`/api/tournaments/${tournamentIdToUse}/break/quarterfinals`, {
				method: "POST",
				headers: { "Content-Type": "application/json" }
			});
			const data = await res.json();

			if (res.ok) {
				showToast("Success", data.message, "success");
				fetchBracket(); // Refresh bracket
			} else {
				showToast("Error", data.error || "Failed to generate quarterfinals", "error");
			}
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	if (isLoading) {
		return (
			<Center h="400px">
				<Spinner size="xl" color="blue.500" />
			</Center>
		);
	}

	// If break not announced yet
	if (!breakData && !bracket) {
		return (
			<Box p={8}>
				<VStack spacing={8} align="center">
					<Icon as={FiAward} boxSize={16} color={mutedText} />
					<VStack spacing={2}>
						<Heading size="lg" color={textColor}>
							Break Not Announced
						</Heading>
						<Text color={mutedText} textAlign="center">
							The tournament director will announce the break after preliminary rounds are complete.
						</Text>
					</VStack>

					{isOrganizer && (
						<Button
							colorScheme="blue"
							size="lg"
							leftIcon={<FiAward />}
							onClick={handleAnnounceBreak}
							isLoading={isAnnouncing}
							loadingText="Announcing Break..."
						>
							Announce Break
						</Button>
					)}
				</VStack>
			</Box>
		);
	}

	return (
		<VStack spacing={8} align="stretch" w="100%">
			{/* Break Announcement */}
			{breakData && breakData.breakingTeams && (
				<Box bg={goldBg} borderRadius="lg" p={6} border="2px" borderColor="yellow.400">
					<VStack spacing={4} align="center">
						<Icon as={FiAward} boxSize={12} color="yellow.500" />
						<Heading size="lg" color={textColor}>
							🎉 Breaking Teams Announced! 🎉
						</Heading>
						<Text color={mutedText} fontSize="lg">
							{breakData.breakingTeams.length} teams have made the break
						</Text>
						<HStack spacing={4} fontSize="sm" color={mutedText}>
							<Text>Cutoff: {breakData.cutoffPoints} points</Text>
							<Text>•</Text>
							<Text>{breakData.cutoffSpeaks?.toFixed(1)} speaks</Text>
						</HStack>
					</VStack>
				</Box>
			)}

			{/* Breaking Teams List */}
			{breakData?.breakingTeams && (
				<Box
					bg={cardBg}
					borderRadius="lg"
					border="1px"
					borderColor={borderColor}
					overflow="hidden"
				>
					<Box bg={headerBg} px={6} py={4} borderBottom="1px" borderColor={borderColor}>
						<Heading size="md" color={textColor}>
							<Icon as={FiAward} mr={2} />
							Breaking Teams
						</Heading>
					</Box>
					<Table variant="simple">
						<Thead>
							<Tr bg={headerBg}>
								<Th color={mutedText}>Seed</Th>
								<Th color={mutedText}>Team</Th>
								<Th color={mutedText}>Institution</Th>
								<Th color={mutedText} isNumeric>Points</Th>
								<Th color={mutedText} isNumeric>Speaks</Th>
								<Th color={mutedText}>Status</Th>
							</Tr>
						</Thead>
						<Tbody>
							{breakData.breakingTeams.map((team, index) => (
								<Tr key={team._id}>
									<Td>
										<Badge
											colorScheme={index < 4 ? "yellow" : "blue"}
											fontSize="md"
											px={3}
											py={1}
										>
											{index + 1}
										</Badge>
									</Td>
									<Td color={textColor} fontWeight="bold">
										{team.name}
									</Td>
									<Td color={mutedText}>{team.institution}</Td>
									<Td isNumeric color={textColor} fontWeight="semibold">
										{team.totalPoints}
									</Td>
									<Td isNumeric color={textColor}>
										{team.totalSpeaks?.toFixed(1) || "0.0"}
									</Td>
									<Td>
										<HStack spacing={2}>
											<Icon as={FiCheckCircle} color="green.500" />
											<Text color="green.500" fontSize="sm">Breaking</Text>
										</HStack>
									</Td>
								</Tr>
							))}
						</Tbody>
					</Table>
				</Box>
			)}

			{/* Organizer Actions */}
			{isOrganizer && !bracket?.quarterfinals && breakData && (
				<Alert status="info" borderRadius="lg">
					<AlertIcon />
					<Box flex="1">
						<AlertTitle>Ready to Generate Quarterfinals</AlertTitle>
						<AlertDescription>
							Click below to create the quarterfinal draw based on team seedings.
						</AlertDescription>
					</Box>
					<Button
						colorScheme="blue"
						onClick={handleGenerateQuarterfinals}
						ml={4}
					>
						Generate Quarterfinals
					</Button>
				</Alert>
			)}

			{/* Elimination Bracket */}
			{bracket && (
				<>
					<Divider />
					<EliminationBracket
						tournamentId={tournamentIdToUse}
						bracket={bracket}
						isOrganizer={isOrganizer}
						onUpdate={fetchBracket}
					/>
				</>
			)}
		</VStack>
	);
};

export default BreakPage;
