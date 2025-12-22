import {
	Box,
	Button,
	Flex,
	Text,
	VStack,
	HStack,
	Badge,
	Spinner,
	useColorModeValue,
	useDisclosure,
	Tabs,
	TabList,
	Tab,
	TabPanels,
	TabPanel,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { FiArrowLeft, FiTarget } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";
import DrawDisplay from "../components/DrawDisplay";

const RoundsPage = () => {
	const { tournamentId } = useParams();
	const navigate = useNavigate();
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();

	const [tournament, setTournament] = useState(null);
	const [rounds, setRounds] = useState([]);
	const [selectedRound, setSelectedRound] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const hoverBg = useColorModeValue("gray.50", "#1a1a1a");

	const isOrganizer = user && tournament?.creator?._id === user._id;

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				// Fetch tournament
				const tournamentRes = await fetch(`/api/tournaments/${tournamentId}`);
				const tournamentData = await tournamentRes.json();
				if (!tournamentRes.ok) throw new Error(tournamentData.error);
				setTournament(tournamentData);

				// Fetch rounds
				const roundsRes = await fetch(`/api/rounds/tournament/${tournamentId}`);
				const roundsData = await roundsRes.json();
				if (roundsRes.ok) {
					setRounds(roundsData);
					if (roundsData.length > 0) {
						setSelectedRound(roundsData[0].roundNumber);
					}
				}
			} catch (error) {
				showToast("Error", error.message, "error");
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [tournamentId, showToast]);

	const getRoundStatusColor = (status) => {
		switch (status) {
			case "scheduled":
				return "gray";
			case "in-progress":
				return "blue";
			case "completed":
				return "green";
			case "cancelled":
				return "red";
			default:
				return "gray";
		}
	};

	if (isLoading) {
		return (
			<Flex justify="center" align="center" minH="60vh">
				<Spinner size="xl" />
			</Flex>
		);
	}

	return (
		<Box maxW="1200px" mx="auto" py={8} px={4}>
			{/* Header */}
			<HStack mb={6}>
				<Button
					variant="ghost"
					leftIcon={<FiArrowLeft />}
					onClick={() => navigate(`/tournament/${tournamentId}`)}
					size="sm"
				>
					Back
				</Button>
			</HStack>

			<VStack align="stretch" spacing={6}>
				{/* Tournament Info */}
				<Box>
					<Text fontSize="2xl" fontWeight="bold" color={textColor} mb={1}>
						{tournament?.name}
					</Text>
					<Text fontSize="sm" color={mutedText}>
						Round Management
					</Text>
				</Box>

				{/* Rounds Tabs */}
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="3xl"
					p={6}
				>
					{rounds.length === 0 ? (
						<Text color={mutedText} textAlign="center" py={8}>
							No rounds created yet
						</Text>
					) : (
						<Tabs
							index={selectedRound ? selectedRound - 1 : 0}
							onChange={(index) => setSelectedRound(index + 1)}
							variant="soft-rounded"
							colorScheme="blue"
						>
							<TabList mb={6} flexWrap="wrap">
								{rounds.map((round) => (
									<Tab key={round._id}>
										<VStack spacing={0}>
											<Text>Round {round.roundNumber}</Text>
											<Badge
												colorScheme={getRoundStatusColor(round.status)}
												variant="subtle"
												fontSize="xs"
												borderRadius="full"
											>
												{round.status}
											</Badge>
										</VStack>
									</Tab>
								))}
							</TabList>

							<TabPanels>
								{rounds.map((round) => (
									<TabPanel key={round._id} px={0}>
										<VStack align="stretch" spacing={4}>
											{/* Round Info */}
											<HStack justify="space-between" flexWrap="wrap">
												<VStack align="start" spacing={0}>
													<Text fontWeight="semibold" color={textColor}>
														Round {round.roundNumber} - {round.roundType}
													</Text>
													<Text fontSize="sm" color={mutedText}>
														{round.completedDebates || 0} / {round.totalDebates || 0} debates completed
													</Text>
												</VStack>
												{round.isDrawReleased && (
													<Badge colorScheme="green" variant="subtle" borderRadius="full">
														Draw Released
													</Badge>
												)}
											</HStack>

											{/* Draw Display */}
											<DrawDisplay
												tournament={tournament}
												roundNumber={round.roundNumber}
												isOrganizer={isOrganizer}
											/>
										</VStack>
									</TabPanel>
								))}
							</TabPanels>
						</Tabs>
					)}
				</Box>
			</VStack>
		</Box>
	);
};

export default RoundsPage;
