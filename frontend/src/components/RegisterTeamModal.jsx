import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalBody,
	Box,
	Flex,
	Text,
	Button,
	Input,
	Select,
	VStack,
	HStack,
	Avatar,
	Badge,
	Divider,
	useColorModeValue,
	FormControl,
	FormLabel,
	Tag,
	TagLabel,
	TagCloseButton,
	IconButton,
	Spinner,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { FiX, FiPlus, FiUsers } from "react-icons/fi";

const RegisterTeamModal = ({ isOpen, onClose, tournament, onTeamRegistered }) => {
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();

	const [formData, setFormData] = useState({
		name: "",
		institution: user?.institution || "",
		members: [user?._id],
	});
	const [memberUsername, setMemberUsername] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [previewUser, setPreviewUser] = useState(null);
	const [fetchingPreview, setFetchingPreview] = useState(false);
	const [memberProfiles, setMemberProfiles] = useState([user]); // Store actual member objects

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const accentColor = useColorModeValue("black", "white");

	const requiredSpeakers = tournament?.format === "BP" ? 2 : 3;

	// Preview user while typing
	useEffect(() => {
		const timer = setTimeout(() => {
			if (memberUsername.trim().length >= 2) {
				fetchUserPreview();
			} else {
				setPreviewUser(null);
			}
		}, 500);

		return () => clearTimeout(timer);
	}, [memberUsername]);

	const fetchUserPreview = async () => {
		setFetchingPreview(true);
		try {
			const res = await fetch(`/api/users/profile/${memberUsername.trim()}`);
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

	const handleAddMember = async () => {
		if (!previewUser) {
			showToast("Error", "Please enter a valid username", "error");
			return;
		}

		if (formData.members.length >= requiredSpeakers) {
			showToast("Error", `Maximum ${requiredSpeakers} speakers allowed`, "error");
			return;
		}

		try {
			if (formData.members.includes(previewUser._id)) {
				showToast("Error", "User already added", "error");
				return;
			}

			setFormData(prev => ({
				...prev,
				members: [...prev.members, previewUser._id],
			}));
			setMemberProfiles(prev => [...prev, previewUser]);
			setMemberUsername("");
			setPreviewUser(null);
			showToast("Success", `Added ${previewUser.name}`, "success");
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	const handleRemoveMember = (userId) => {
		if (userId === user._id) {
			showToast("Error", "Cannot remove yourself", "error");
			return;
		}

		setFormData(prev => ({
			...prev,
			members: prev.members.filter(id => id !== userId),
		}));
		setMemberProfiles(prev => prev.filter(member => member._id !== userId));
	};

	const handleSubmit = async () => {
		if (!formData.name.trim()) {
			showToast("Error", "Team name is required", "error");
			return;
		}

		if (formData.members.length !== requiredSpeakers) {
			showToast("Error", `${tournament.format} requires ${requiredSpeakers} speakers`, "error");
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch(`/api/teams/register/${tournament._id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					speakerOrder: formData.members,
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Team registered!", "success");
			onTeamRegistered && onTeamRegistered(data);
			handleClose();
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setFormData({
			name: "",
			institution: user?.institution || "",
			members: [user?._id],
		});
		setMemberProfiles([user]);
		setMemberUsername("");
		setPreviewUser(null);
		onClose();
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose} size="lg">
			<ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
			<ModalContent bg={cardBg} borderRadius="3xl" border="1px" borderColor={borderColor} mx={4}>
				<ModalBody p={6}>
					<VStack align="stretch" spacing={4}>
						{/* Header */}
						<HStack justify="space-between">
							<HStack>
								<FiUsers size={24} />
								<Text fontSize="xl" fontWeight="bold" color={textColor}>
									Register Team
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
							Register your team for {tournament?.name} ({tournament?.format} format - {requiredSpeakers} speakers required)
						</Text>

						<Divider />

						{/* Team Name */}
						<FormControl isRequired>
							<FormLabel color={textColor} fontSize="sm" fontWeight="semibold">
								Team Name
							</FormLabel>
							<Input
								value={formData.name}
								onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
								placeholder="Enter team name"
								color={textColor}
								borderColor={borderColor}
								_hover={{ borderColor: accentColor }}
								_focus={{ borderColor: accentColor }}
							/>
						</FormControl>

						{/* Institution */}
						<FormControl isRequired>
							<FormLabel color={textColor} fontSize="sm" fontWeight="semibold">
								Institution
							</FormLabel>
							<Input
								value={formData.institution}
								onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
								placeholder="Your institution name"
								color={textColor}
								borderColor={borderColor}
								_hover={{ borderColor: accentColor }}
								_focus={{ borderColor: accentColor }}
							/>
						</FormControl>

						{/* Team Members */}
						<FormControl isRequired>
							<FormLabel color={textColor} fontSize="sm" fontWeight="semibold">
								Team Members ({formData.members.length}/{requiredSpeakers})
							</FormLabel>
							
							<VStack align="stretch" spacing={2}>
								<Text fontSize="xs" color={mutedText}>
									{formData.members.length < requiredSpeakers 
										? `Add ${requiredSpeakers - formData.members.length} more member${requiredSpeakers - formData.members.length > 1 ? 's' : ''}.` 
										: 'Team complete!'}
								</Text>

								{/* Selected Members List */}
								<VStack align="stretch" spacing={2}>
									{memberProfiles.map((member, index) => (
										<Box
											key={member._id}
											p={3}
											borderRadius="lg"
											border="1px"
											borderColor={borderColor}
											bg={useColorModeValue("white", "#181818")}
										>
											<HStack justify="space-between">
												<HStack flex={1}>
													<Avatar size="sm" name={member.name} />
													<VStack align="start" spacing={0}>
														<HStack>
															<Text fontSize="sm" fontWeight="semibold" color={textColor}>
																{member.name}
															</Text>
															<Badge colorScheme="blue" fontSize="xs" borderRadius="full">
																Speaker {index + 1} {index === 0 ? '(Captain)' : ''}
															</Badge>
														</HStack>
														<Text fontSize="xs" color={mutedText}>
															@{member.username}
														</Text>
													</VStack>
												</HStack>
												{member._id !== user._id && (
													<IconButton
														icon={<FiX />}
														size="sm"
														variant="ghost"
														colorScheme="red"
														onClick={() => handleRemoveMember(member._id)}
														aria-label="Remove member"
													/>
												)}
											</HStack>
										</Box>
									))}
								</VStack>

								{/* Add Member - Simple username input */}
								{formData.members.length < requiredSpeakers && (
									<VStack align="stretch" spacing={2}>
										<Input
											value={memberUsername}
											onChange={(e) => setMemberUsername(e.target.value)}
											placeholder="Enter teammate's username"
											color={textColor}
											borderColor={borderColor}
											onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
										/>

										{/* User Preview */}
										{fetchingPreview && (
											<Box p={2} borderRadius="md" border="1px" borderColor={borderColor}>
												<Text fontSize="xs" color={mutedText}>Loading...</Text>
											</Box>
										)}

										{previewUser && !fetchingPreview && (
											<Box 
												p={3} 
												borderRadius="md" 
												border="1px" 
												borderColor={borderColor} 
												bg={useColorModeValue("gray.50", "#1a1a1a")}
												cursor="pointer"
												_hover={{ bg: useColorModeValue("gray.100", "#252525"), borderColor: accentColor }}
												transition="all 0.2s"
												onClick={handleAddMember}
											>
												<HStack>
													<Avatar size="sm" name={previewUser.name} />
													<VStack align="start" spacing={0} flex={1}>
														<Text fontSize="sm" fontWeight="semibold" color={textColor}>
															{previewUser.name}
														</Text>
														<Text fontSize="xs" color={mutedText}>
															@{previewUser.username}
														</Text>
													</VStack>
													<IconButton
														icon={<FiPlus />}
														size="sm"
														colorScheme="blue"
														variant="ghost"
														aria-label="Add member"
													/>
												</HStack>
											</Box>
										)}

										{memberUsername.trim().length >= 2 && !previewUser && !fetchingPreview && (
											<Text fontSize="xs" color="red.400">
												User not found
											</Text>
										)}
									</VStack>
								)}
							</VStack>
						</FormControl>

						<Divider />

						{/* Action Buttons */}
						<HStack justify="flex-end">
							<Button variant="ghost" onClick={handleClose}>
								Cancel
							</Button>
							<Button
								colorScheme="blue"
								onClick={handleSubmit}
								isLoading={isLoading}
								isDisabled={formData.members.length !== requiredSpeakers || !formData.name.trim()}
							>
								Register Team
							</Button>
						</HStack>
					</VStack>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};

export default RegisterTeamModal;
