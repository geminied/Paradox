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
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { FiArrowLeft } from "react-icons/fi";
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
	const pillBg = useColorModeValue("gray.100", "rgba(255,255,255,0.06)");
	const pillHoverBg = useColorModeValue("gray.200", "rgba(255,255,255,0.1)");
	const pillActiveBg = useColorModeValue("purple.100", "rgba(128,90,213,0.2)");

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
		<Box py={6}>
			{/* Back Button */}
			<HStack
				mb={4}
				cursor="pointer"
				onClick={() => navigate(`/tournament/${tournamentId}`)}
				_hover={{ color: textColor }}
				color={mutedText}
				transition="all 0.2s"
			>
				<FiArrowLeft size={18} />
				<Text fontSize="sm">Back to Tournament</Text>
			</HStack>

			{/* Tournament Header */}
			<Box mb={6}>
				<Text fontSize="2xl" fontWeight="bold" color={textColor} mb={1}>
					{tournament?.name}
				</Text>
				<Text fontSize="sm" color={mutedText}>
					Round Management
				</Text>
			</Box>

			{/* Round Filter Pills */}
			{rounds.length === 0 ? (
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="2xl"
					p={8}
				>
					<Text color={mutedText} textAlign="center">
						No rounds created yet
					</Text>
				</Box>
			) : (
				<>
					{/* Filter Pills */}
					<HStack spacing={2} mb={6} flexWrap="wrap">
						{rounds.map((round) => (
							<Box
								key={round._id}
								px={4}
								py={2}
								borderRadius="full"
								fontSize="sm"
								fontWeight="medium"
								cursor="pointer"
								transition="all 0.15s"
								bg={selectedRound === round.roundNumber ? pillActiveBg : pillBg}
								color={selectedRound === round.roundNumber ? "purple.500" : textColor}
								_hover={{ bg: selectedRound === round.roundNumber ? pillActiveBg : pillHoverBg }}
								onClick={() => setSelectedRound(round.roundNumber)}
							>
								<HStack spacing={2}>
									<Text>Round {round.roundNumber}</Text>
									<Badge
										colorScheme={getRoundStatusColor(round.status)}
										variant="subtle"
										fontSize="xs"
										borderRadius="full"
									>
										{round.status === "scheduled" ? "pending" : round.status}
									</Badge>
								</HStack>
							</Box>
						))}
					</HStack>

					{/* Round Content */}
					{rounds.filter(r => r.roundNumber === selectedRound).map((round) => (
						<VStack key={round._id} align="stretch" spacing={6}>
							{/* Round Info Card */}
							<Box
								bg={cardBg}
								border="1px"
								borderColor={borderColor}
								borderRadius="2xl"
								p={5}
							>
								<HStack justify="space-between" flexWrap="wrap" mb={4}>
									<VStack align="start" spacing={1}>
										<Text fontSize="lg" fontWeight="bold" color={textColor}>
											Round {round.roundNumber}
										</Text>
										<HStack spacing={3}>
											<Text fontSize="sm" color={mutedText}>
												{round.roundType}
											</Text>
											<Text fontSize="sm" color={mutedText}>•</Text>
											<Text fontSize="sm" color={mutedText}>
												{round.completedDebates || 0} / {round.totalDebates || 0} debates completed
											</Text>
										</HStack>
									</VStack>
									{round.isDrawReleased && (
										<Badge colorScheme="green" variant="subtle" borderRadius="full" px={3} py={1}>
											Draw Released
										</Badge>
									)}
								</HStack>

								{/* Motion Display */}
								{round.motion && (
									<Box
										p={4}
										borderRadius="xl"
										bg={useColorModeValue("blue.50", "rgba(66, 153, 225, 0.1)")}
										border="1px"
										borderColor={useColorModeValue("blue.200", "rgba(66, 153, 225, 0.3)")}
									>
										<VStack align="start" spacing={3}>
											<HStack>
												<Badge colorScheme="blue" variant="solid" borderRadius="full" fontSize="xs" px={2}>
													MOTION
												</Badge>
												{round.motion.isReleased ? (
													<Badge colorScheme="green" variant="subtle" borderRadius="full" fontSize="xs" px={2}>
														RELEASED
													</Badge>
												) : (
													<Badge colorScheme="orange" variant="subtle" borderRadius="full" fontSize="xs" px={2}>
														NOT RELEASED
													</Badge>
												)}
											</HStack>
											{round.motion.isReleased || isOrganizer ? (
												<>
													<Text fontSize="md" fontWeight="bold" color={textColor}>
														{round.motion.motionText}
													</Text>
													{round.motion.infoSlide && (
														<Box
															mt={2}
															p={3}
															bg={useColorModeValue("white", "#0a0a0a")}
															borderRadius="lg"
															w="100%"
														>
															<Text fontSize="xs" fontWeight="semibold" color={mutedText} mb={1}>
																Info Slide
															</Text>
															<Text fontSize="sm" color={textColor}>
																{round.motion.infoSlide}
															</Text>
														</Box>
													)}
													<Text fontSize="xs" color={mutedText} mt={2}>
														Prep Time: {round.motion.prepTime} minutes
													</Text>
												</>
											) : (
												<Text fontSize="sm" color={mutedText} fontStyle="italic">
													Motion will be revealed when released by organizers
												</Text>
											)}
										</VStack>
									</Box>
								)}
								{!round.motion && isOrganizer && (
									<Box
										p={4}
										borderRadius="xl"
										bg={useColorModeValue("orange.50", "rgba(237, 137, 54, 0.1)")}
										border="1px"
										borderColor={useColorModeValue("orange.200", "rgba(237, 137, 54, 0.3)")}
									>
										<Text fontSize="sm" color={textColor}>
											⚠️ No motion created for this round yet
										</Text>
									</Box>
								)}
							</Box>

							{/* Draw Display */}
							<DrawDisplay
								tournament={tournament}
								roundNumber={round.roundNumber}
								isOrganizer={isOrganizer}
							/>
						</VStack>
					))}
				</>
			)}
		</Box>
	);
};

export default RoundsPage;
