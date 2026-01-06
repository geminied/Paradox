import {
	Box,
	Button,
	Flex,
	Text,
	VStack,
	HStack,
	Badge,
	Divider,
	useColorModeValue,
	Spinner,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiTarget, FiRefreshCw, FiTrash2, FiArrowRight } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const DrawDisplay = ({ tournament, roundNumber, isOrganizer }) => {
	const showToast = useShowToast();
	const navigate = useNavigate();
	const [draw, setDraw] = useState([]);
	const [round, setRound] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const accentColor = useColorModeValue("black", "white");

	useEffect(() => {
		if (tournament?._id && roundNumber) {
			fetchRoundAndDraw();
		}
	}, [tournament, roundNumber]);

	const fetchRoundAndDraw = async () => {
		setIsLoading(true);
		try {
			// Fetch round details to get the round ID
			const roundsRes = await fetch(`/api/rounds/tournament/${tournament._id}`);
			const roundsData = await roundsRes.json();
			if (roundsRes.ok) {
				const currentRound = roundsData.find(r => r.roundNumber === roundNumber);
				setRound(currentRound);
				
				// Fetch draw if round exists
				if (currentRound?._id) {
					const drawRes = await fetch(`/api/tournaments/rounds/${currentRound._id}/draw`);
					const drawData = await drawRes.json();
					if (drawRes.ok && Array.isArray(drawData)) {
						setDraw(drawData);
					} else {
						setDraw([]);
					}
				}
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGenerateDraw = async () => {
		if (!round?._id) {
			showToast("Error", "Round not found", "error");
			return;
		}
		
		setIsGenerating(true);
		try {
			const res = await fetch(
				`/api/tournaments/rounds/${round._id}/generate-draw`,
				{ method: "POST" }
			);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Draw generated successfully!", "success");
			// Refresh the draw
			await fetchRoundAndDraw();
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleDeleteDraw = async () => {
		if (!round?._id) {
			showToast("Error", "Round not found", "error");
			return;
		}
		
		if (!window.confirm("Are you sure you want to delete this draw? This will allow you to regenerate it.")) {
			return;
		}
		
		setIsDeleting(true);
		try {
			const res = await fetch(
				`/api/tournaments/rounds/${round._id}/draw`,
				{ method: "DELETE" }
			);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Draw deleted successfully!", "success");
			setDraw([]);
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsDeleting(false);
		}
	};

	const getPositionColor = (position) => {
		const colors = {
			OG: "green",
			OO: "blue",
			CG: "purple",
			CO: "orange",
			Proposition: "green",
			Opposition: "red",
		};
		return colors[position] || "gray";
	};

	if (isLoading) {
		return (
			<Flex justify="center" py={8}>
				<Spinner />
			</Flex>
		);
	}

	if (draw.length === 0) {
		return (
			<Box textAlign="center" py={8}>
				<Text color={mutedText} mb={4}>
					No draw generated yet for Round {roundNumber}
				</Text>
				{isOrganizer && (
					<Button
						leftIcon={<FiTarget />}
						colorScheme="blue"
						onClick={handleGenerateDraw}
						isLoading={isGenerating}
						borderRadius="full"
					>
						Generate Draw
					</Button>
				)}
			</Box>
		);
	}

	return (
		<VStack align="stretch" spacing={4}>
			{/* Header */}
			<HStack justify="space-between">
				<HStack>
					<FiTarget size={20} />
					<Text fontWeight="semibold" color={textColor}>
						Round {roundNumber} Draw - {draw.length} {draw.length === 1 ? 'Room' : 'Rooms'}
					</Text>
				</HStack>
				{isOrganizer && (
					<HStack>
						<Button
							size="sm"
							leftIcon={<FiRefreshCw />}
							variant="ghost"
							onClick={fetchRoundAndDraw}
						>
							Refresh
						</Button>
						<Button
							size="sm"
							leftIcon={<FiTrash2 />}
							variant="ghost"
							colorScheme="red"
							onClick={handleDeleteDraw}
							isLoading={isDeleting}
						>
							Delete Draw
						</Button>
					</HStack>
				)}
			</HStack>

			{/* Draw Rooms */}
			<VStack spacing={3} align="stretch">
				{draw.map((room, index) => (
					<Box
						key={room._id}
						bg={cardBg}
						border="1px"
						borderColor={borderColor}
						borderRadius="2xl"
						p={4}
					>
						<VStack align="stretch" spacing={3}>
							{/* Room Header */}
							<HStack justify="space-between">
								<VStack align="start" spacing={0}>
									<Text fontWeight="bold" color={textColor}>
										{room.roomName || `Room ${index + 1}`}
									</Text>
									<Badge colorScheme="blue" variant="subtle" borderRadius="full" fontSize="xs">
										{room.status}
									</Badge>
								</VStack>
								<Button
									size="sm"
									rightIcon={<FiArrowRight />}
									colorScheme="blue"
									variant="ghost"
									borderRadius="full"
									onClick={() => navigate(`/debate-room/${room._id}`)}
								>
									View Room
								</Button>
							</HStack>

							<Divider />

							{/* Teams */}
							<VStack align="stretch" spacing={2}>
								{room.teams.map((teamInfo) => (
									<HStack
										key={teamInfo.team._id}
										justify="space-between"
										p={2}
										borderRadius="lg"
										bg={useColorModeValue("gray.50", "#0a0a0a")}
									>
										<HStack flex={1}>
											<Badge
												colorScheme={getPositionColor(teamInfo.position)}
												variant="solid"
												borderRadius="full"
												px={2}
											>
												{teamInfo.position}
											</Badge>
											<VStack align="start" spacing={0} flex={1}>
												<Text fontSize="sm" fontWeight="semibold" color={textColor}>
													{teamInfo.team.name}
												</Text>
												<Text fontSize="xs" color={mutedText}>
													{teamInfo.team.institution}
												</Text>
											</VStack>
										</HStack>
										{teamInfo.hasSubmitted && (
											<Badge colorScheme="green" variant="subtle" fontSize="xs">
												Submitted
											</Badge>
										)}
									</HStack>
								))}
							</VStack>

							{/* Judges */}
							{room.judges && room.judges.length > 0 && (
								<>
									<Divider />
									<Box>
										<Text fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
											Judges
										</Text>
										<HStack spacing={2} flexWrap="wrap">
											{room.judges.map((judge) => (
												<Badge
													key={judge._id}
													variant="outline"
													borderRadius="full"
													px={2}
													colorScheme={judge._id === room.chair?._id ? "purple" : "gray"}
												>
													{judge.name}
													{judge._id === room.chair?._id && " (Chair)"}
												</Badge>
											))}
										</HStack>
									</Box>
								</>
							)}
						</VStack>
					</Box>
				))}
			</VStack>
		</VStack>
	);
};

export default DrawDisplay;
