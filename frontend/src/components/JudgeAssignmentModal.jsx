import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalBody,
	Box,
	Text,
	Button,
	Input,
	VStack,
	HStack,
	Avatar,
	Badge,
	Divider,
	useColorModeValue,
	IconButton,
	Flex,
	Spinner,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiX, FiUserPlus, FiAward } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const JudgeAssignmentModal = ({ isOpen, onClose, tournament, onJudgeAdded }) => {
	const showToast = useShowToast();

	const [judgeUsername, setJudgeUsername] = useState("");
	const [tournamentJudges, setTournamentJudges] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [addingJudge, setAddingJudge] = useState(false);
	const [previewUser, setPreviewUser] = useState(null);
	const [fetchingPreview, setFetchingPreview] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const hoverBg = useColorModeValue("gray.50", "#1a1a1a");
	const accentColor = useColorModeValue("black", "white");

	// Fetch tournament judges
	useEffect(() => {
		if (isOpen && tournament?._id) {
			fetchTournamentJudges();
		}
	}, [isOpen, tournament]);

	// Preview user while typing
	useEffect(() => {
		const timer = setTimeout(() => {
			if (judgeUsername.trim().length >= 2) {
				fetchUserPreview();
			} else {
				setPreviewUser(null);
			}
		}, 500);

		return () => clearTimeout(timer);
	}, [judgeUsername]);

	const fetchTournamentJudges = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/tournaments/${tournament._id}/judges`);
			const data = await res.json();
			if (res.ok) {
				setTournamentJudges(data);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchUserPreview = async () => {
		setFetchingPreview(true);
		try {
			const res = await fetch(`/api/users/profile/${judgeUsername.trim()}`);
			const data = await res.json();
			if (res.ok) {
				setPreviewUser(data);
			} else {
				setPreviewUser(null);
			}
		} catch (error) {
			setPreviewUser(null);
		} finally {
			setFetchingPreview(false);
		}
	};

	const handleAddJudge = async () => {
		if (!previewUser) {
			showToast("Error", "Please enter a valid username", "error");
			return;
		}

		setAddingJudge(true);
		try {
			// Check if already added
			if (tournamentJudges.some(j => j._id === previewUser._id)) {
				showToast("Error", "Judge already added", "error");
				return;
			}

			// Add to tournament
			const res = await fetch(`/api/tournaments/${tournament._id}/judges`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ judgeId: previewUser._id }),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", `Added ${previewUser.name} as judge`, "success");
			setJudgeUsername("");
			setPreviewUser(null);
			fetchTournamentJudges();
			onJudgeAdded && onJudgeAdded();
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setAddingJudge(false);
		}
	};

	const handleRemoveJudge = async (judgeId) => {
		try {
			const res = await fetch(`/api/tournaments/${tournament._id}/judges/${judgeId}`, {
				method: "DELETE",
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Judge removed", "success");
			fetchTournamentJudges();
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	const getExperienceColor = (experience) => {
		switch (experience) {
			case "novice": return "gray";
			case "intermediate": return "blue";
			case "experienced": return "purple";
			case "expert": return "orange";
			default: return "gray";
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} size="2xl">
			<ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
			<ModalContent bg={cardBg} borderRadius="3xl" border="1px" borderColor={borderColor} mx={4}>
				<ModalBody p={6}>
					<VStack align="stretch" spacing={4}>
						{/* Header */}
						<HStack justify="space-between">
							<HStack>
								<FiAward size={24} />
								<Text fontSize="xl" fontWeight="bold" color={textColor}>
									Manage Judges
								</Text>
							</HStack>
							<IconButton
								icon={<FiX />}
								variant="ghost"
								onClick={onClose}
								aria-label="Close"
								size="sm"
							/>
						</HStack>

						<Text fontSize="sm" color={mutedText}>
							Manage judge pool for {tournament?.name}
						</Text>

						<Divider />

						{/* Current Judges */}
						<Box>
							<Text fontWeight="semibold" fontSize="sm" color={textColor} mb={3}>
								Current Judges ({tournamentJudges.length})
							</Text>
							{isLoading ? (
								<Flex justify="center" py={4}>
									<Spinner />
								</Flex>
							) : tournamentJudges.length === 0 ? (
								<Text fontSize="sm" color={mutedText} textAlign="center" py={4}>
									No judges assigned yet
								</Text>
							) : (
								<VStack spacing={2} maxH="200px" overflowY="auto">
									{tournamentJudges.map((judge) => (
										<Box
											key={judge._id}
											w="full"
											p={3}
											borderRadius="lg"
											border="1px"
											borderColor={borderColor}
											_hover={{ bg: hoverBg }}
										>
											<HStack justify="space-between">
												<HStack flex={1}>
													<Avatar size="sm" name={judge.name} />
													<VStack align="start" spacing={0} flex={1}>
														<Text fontSize="sm" fontWeight="semibold" color={textColor}>
															{judge.name}
														</Text>
														<HStack spacing={2}>
															<Text fontSize="xs" color={mutedText}>
																{judge.institution}
															</Text>
															<Badge
																colorScheme={getExperienceColor(judge.judgeProfile?.experience)}
																variant="subtle"
																fontSize="xs"
																borderRadius="full"
															>
																{judge.judgeProfile?.experience}
															</Badge>
														</HStack>
													</VStack>
												</HStack>
												<Button
													size="sm"
													variant="ghost"
													colorScheme="red"
													onClick={() => handleRemoveJudge(judge._id)}
												>
													Remove
												</Button>
											</HStack>
										</Box>
									))}
								</VStack>
							)}
						</Box>

						<Divider />

						{/* Add Judge - Simple username input */}
						<Box>
							<Text fontWeight="semibold" fontSize="sm" color={textColor} mb={3}>
								Add Judge
							</Text>
							<VStack align="stretch" spacing={3}>
								<Input
									placeholder="Enter judge's username"
									value={judgeUsername}
									onChange={(e) => setJudgeUsername(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && handleAddJudge()}
									color={textColor}
									borderColor={borderColor}
								/>

								{/* User Preview */}
								{fetchingPreview && (
									<Box p={3} borderRadius="lg" border="1px" borderColor={borderColor}>
										<HStack>
											<Spinner size="sm" />
											<Text fontSize="sm" color={mutedText}>Loading user...</Text>
										</HStack>
									</Box>
								)}

								{previewUser && !fetchingPreview && (
									<Box 
										p={3} 
										borderRadius="lg" 
										border="1px" 
										borderColor={borderColor} 
										bg={hoverBg}
										cursor="pointer"
										_hover={{ bg: useColorModeValue("gray.100", "#252525"), borderColor: accentColor }}
										transition="all 0.2s"
										onClick={handleAddJudge}
									>
										<HStack>
											<Avatar size="sm" name={previewUser.name} />
											<VStack align="start" spacing={0} flex={1}>
												<Text fontSize="sm" fontWeight="semibold" color={textColor}>
													{previewUser.name}
												</Text>
												<Text fontSize="xs" color={mutedText}>
													@{previewUser.username} • {previewUser.institution}
												</Text>
												{previewUser.judgeProfile?.isActive ? (
													<HStack spacing={2} mt={1}>
														<Badge
															colorScheme={getExperienceColor(previewUser.judgeProfile.experience)}
															variant="subtle"
															fontSize="xs"
															borderRadius="full"
														>
															{previewUser.judgeProfile.experience}
														</Badge>
														{previewUser.preferredFormats?.includes(tournament?.format) ? (
															<Badge colorScheme="green" variant="subtle" fontSize="xs" borderRadius="full">
																{tournament?.format} Judge
															</Badge>
														) : (
															<Badge colorScheme="orange" variant="subtle" fontSize="xs" borderRadius="full">
																Can judge {tournament?.format} (needs profile update)
															</Badge>
														)}
													</HStack>
												) : (
													<Badge colorScheme="blue" variant="subtle" fontSize="xs" mt={1}>
														Not yet activated judge profile
													</Badge>
												)}
											</VStack>
											<IconButton
												icon={<FiUserPlus />}
												size="sm"
												colorScheme="blue"
												variant="ghost"
												aria-label="Add judge"
											/>
										</HStack>
									</Box>
								)}

								{judgeUsername.trim().length >= 2 && !previewUser && !fetchingPreview && (
									<Text fontSize="xs" color="red.400">
										User not found
									</Text>
								)}
							</VStack>

							<Text fontSize="xs" color={mutedText} mt={2}>
								Enter the username of any user to add them as a judge
							</Text>
						</Box>

						<Divider />

						{/* Close Button */}
						<Button onClick={onClose} colorScheme="blue" borderRadius="full">
							Done
						</Button>
					</VStack>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};

export default JudgeAssignmentModal;
