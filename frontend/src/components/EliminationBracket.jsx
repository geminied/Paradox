import {
	Box,
	VStack,
	HStack,
	Heading,
	Text,
	Button,
	Badge,
	useColorModeValue,
	Icon,
	Divider,
	Grid,
	GridItem,
	Spinner,
	Center,
	Alert,
	AlertIcon,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAward, FiArrowRight, FiUsers } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const EliminationBracket = ({ tournamentId, bracket, isOrganizer, onUpdate }) => {
	const showToast = useShowToast();
	const navigate = useNavigate();
	const [isGenerating, setIsGenerating] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.600", "#888888");
	const winnerBg = useColorModeValue("green.50", "#002a00");
	const goldColor = useColorModeValue("yellow.400", "yellow.500");

	const handleGenerateSemifinals = async () => {
		if (!bracket.quarterfinals?.round?._id) {
			showToast("Error", "Quarterfinals not found", "error");
			return;
		}

		setIsGenerating(true);
		try {
			const res = await fetch(`/api/tournaments/${tournamentId}/break/semifinals`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ qfRoundId: bracket.quarterfinals.round._id })
			});
			const data = await res.json();

			if (res.ok) {
				showToast("Success", data.message, "success");
				onUpdate(); // Refresh bracket
			} else {
				showToast("Error", data.error || "Failed to generate semifinals", "error");
			}
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleGenerateGrandFinal = async () => {
		if (!bracket.semifinals?.round?._id) {
			showToast("Error", "Semifinals not found", "error");
			return;
		}

		setIsGenerating(true);
		try {
			const res = await fetch(`/api/tournaments/${tournamentId}/break/finals`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sfRoundId: bracket.semifinals.round._id })
			});
			const data = await res.json();

			if (res.ok) {
				showToast("Success", data.message, "success");
				onUpdate(); // Refresh bracket
			} else {
				showToast("Error", data.error || "Failed to generate grand final", "error");
			}
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleCompleteChampionship = async () => {
		setIsGenerating(true);
		try {
			const res = await fetch(`/api/tournaments/${tournamentId}/complete`, {
				method: "POST",
				headers: { "Content-Type": "application/json" }
			});
			const data = await res.json();

			if (res.ok) {
				showToast("Success", `🏆 ${data.champion.name} is the champion!`, "success");
				onUpdate(); // Refresh bracket
			} else {
				showToast("Error", data.error || "Failed to complete tournament", "error");
			}
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsGenerating(false);
		}
	};

	const renderDebateCard = (debate, roundName) => {
		const teams = debate.teams || [];
		const hasResults = debate.hasResults;

		return (
			<Box
				key={debate._id}
				bg={cardBg}
				borderRadius="lg"
				border="2px"
				borderColor={hasResults ? "green.400" : borderColor}
				p={4}
				transition="all 0.2s"
				_hover={{ shadow: "lg", transform: "translateY(-2px)" }}
				cursor="pointer"
				onClick={() => navigate(`/debate/${debate._id}`)}
			>
				<VStack spacing={3} align="stretch">
					<HStack justify="space-between">
						<Text fontSize="sm" fontWeight="bold" color={mutedText}>
							{debate.roomName || roundName}
						</Text>
						{hasResults && (
							<Badge colorScheme="green" fontSize="xs">
								Complete
							</Badge>
						)}
					</HStack>

					<VStack spacing={2} align="stretch">
						{teams
							.sort((a, b) => (a.rank || 99) - (b.rank || 99))
							.map((teamData, idx) => (
								<HStack
									key={teamData.team?._id || idx}
									justify="space-between"
									bg={teamData.rank === 1 ? winnerBg : "transparent"}
									p={2}
									borderRadius="md"
									border="1px"
									borderColor={teamData.rank === 1 ? "green.400" : borderColor}
								>
									<HStack spacing={2}>
										<Badge
											colorScheme={teamData.rank === 1 ? "green" : "gray"}
											fontSize="xs"
										>
											{teamData.position}
										</Badge>
										<Text
											fontSize="sm"
											color={textColor}
											fontWeight={teamData.rank === 1 ? "bold" : "normal"}
										>
											{teamData.team?.name || "TBD"}
										</Text>
									</HStack>
									{hasResults && teamData.rank && (
										<HStack spacing={2}>
											{teamData.rank === 1 && (
											<Icon as={FiAward} color={goldColor} boxSize={4} />
											)}
											<Text fontSize="xs" color={mutedText}>
												{teamData.rank === 1
													? "1st"
													: teamData.rank === 2
													? "2nd"
													: teamData.rank === 3
													? "3rd"
													: "4th"}
											</Text>
										</HStack>
									)}
								</HStack>
							))}
					</VStack>

					<Button
						size="sm"
						variant="outline"
						colorScheme="blue"
						rightIcon={<FiArrowRight />}
						onClick={() => navigate(`/debate/${debate._id}`)}
					>
						{debate.status === "completed" ? "View Results" : "Enter Room"}
					</Button>
				</VStack>
			</Box>
		);
	};

	return (
		<VStack spacing={8} align="stretch" w="100%">
			<Heading size="lg" color={textColor}>
				<Icon as={FiAward} mr={2} />
				Elimination Bracket
			</Heading>

			{/* Quarterfinals */}
			{bracket.quarterfinals && (
				<Box>
					<HStack justify="space-between" mb={4}>
						<Heading size="md" color={textColor}>
							Quarterfinals
						</Heading>
						<Badge colorScheme="blue" fontSize="md" px={3} py={1}>
							Round {bracket.quarterfinals.round.roundNumber}
						</Badge>
					</HStack>
					<Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
						{bracket.quarterfinals.debates?.map((debate) =>
							renderDebateCard(debate, "Quarterfinal")
						)}
					</Grid>

					{/* Generate Semifinals Button */}
					{isOrganizer &&
						!bracket.semifinals &&
						bracket.quarterfinals.round.status === "completed" && (
							<Alert status="success" mt={6} borderRadius="lg">
								<AlertIcon />
								<Box flex="1">
									<Text fontWeight="bold">Quarterfinals Complete!</Text>
									<Text fontSize="sm">Ready to generate semifinals.</Text>
								</Box>
								<Button
									colorScheme="blue"
									onClick={handleGenerateSemifinals}
									isLoading={isGenerating}
									ml={4}
								>
									Generate Semifinals
								</Button>
							</Alert>
						)}
				</Box>
			)}

			{/* Semifinals */}
			{bracket.semifinals && (
				<>
					<Divider />
					<Box>
						<HStack justify="space-between" mb={4}>
							<Heading size="md" color={textColor}>
								Semifinals
							</Heading>
							<Badge colorScheme="purple" fontSize="md" px={3} py={1}>
								Round {bracket.semifinals.round.roundNumber}
							</Badge>
						</HStack>
						<Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
							{bracket.semifinals.debates?.map((debate) =>
								renderDebateCard(debate, "Semifinal")
							)}
						</Grid>

						{/* Generate Grand Final Button */}
						{isOrganizer &&
							!bracket.grandFinal &&
							bracket.semifinals.round.status === "completed" && (
								<Alert status="success" mt={6} borderRadius="lg">
									<AlertIcon />
									<Box flex="1">
										<Text fontWeight="bold">Semifinals Complete!</Text>
										<Text fontSize="sm">Ready to generate grand final.</Text>
									</Box>
									<Button
										colorScheme="blue"
										onClick={handleGenerateGrandFinal}
										isLoading={isGenerating}
										ml={4}
									>
										Generate Grand Final
									</Button>
								</Alert>
							)}
					</Box>
				</>
			)}

			{/* Grand Final */}
			{bracket.grandFinal && (
				<>
					<Divider />
					<Box>
						<HStack justify="space-between" mb={4}>
							<Heading size="md" color={textColor}>
								<Icon as={FiAward} color={goldColor} mr={2} />
								Grand Final
							</Heading>
							<Badge colorScheme="yellow" fontSize="md" px={3} py={1}>
								Round {bracket.grandFinal.round.roundNumber}
							</Badge>
						</HStack>
						<Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
							{bracket.grandFinal.debates?.map((debate) =>
								renderDebateCard(debate, "Grand Final")
							)}
						</Grid>
					</Box>
				</>
			)}

			{/* Champion Display */}
			{bracket.champion && (
				<Box
					bg="linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
					borderRadius="xl"
					p={8}
					textAlign="center"
					border="4px"
					borderColor="gold"
					boxShadow="0 0 30px rgba(255, 215, 0, 0.3)"
				>
					<VStack spacing={4}>
						<Icon as={FiAward} boxSize={16} color="white" />
						<Heading size="xl" color="white">
							🏆 CHAMPION 🏆
						</Heading>
						<Text fontSize="3xl" fontWeight="bold" color="white">
							{bracket.champion.name}
						</Text>
						<Text fontSize="lg" color="white">
							{bracket.champion.institution}
						</Text>
						<Badge colorScheme="yellow" fontSize="lg" px={6} py={2}>
							Tournament Winner
						</Badge>
					</VStack>
				</Box>
			)}

			{/* Complete Tournament Button */}
			{isOrganizer &&
				bracket.grandFinal &&
				bracket.grandFinal.round.status === "completed" &&
				!bracket.champion && (
					<Alert status="warning" borderRadius="lg">
						<AlertIcon />
						<Box flex="1">
							<Text fontWeight="bold">Grand Final Complete!</Text>
							<Text fontSize="sm">Click to crown the champion and complete the tournament.</Text>
						</Box>
						<Button
							colorScheme="yellow"
							onClick={handleCompleteChampionship}
							isLoading={isGenerating}
							ml={4}
						>
							Complete Tournament
						</Button>
					</Alert>
				)}
		</VStack>
	);
};

export default EliminationBracket;
