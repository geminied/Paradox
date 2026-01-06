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
	Textarea,
	VStack,
	HStack,
	Divider,
	useColorModeValue,
	FormControl,
	FormLabel,
	IconButton,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiX, FiFileText } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const CreateMotionModal = ({ isOpen, onClose, tournament, onMotionCreated }) => {
	const showToast = useShowToast();

	const [formData, setFormData] = useState({
		roundNumber: 1,
		motionText: "",
		infoSlide: "",
		motionType: "open",
		prepTime: tournament?.format === "BP" ? 15 : 30,
	});
	const [isLoading, setIsLoading] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const accentColor = useColorModeValue("black", "white");

	const handleSubmit = async () => {
		if (!formData.motionText.trim()) {
			showToast("Error", "Motion text is required", "error");
			return;
		}

		setIsLoading(true);
		try {
			// Calculate preliminary rounds based on tournament structure
			const breakTeams = tournament.breakingTeams || 8;
			const totalRounds = tournament.numberOfRounds || 5;
			const breakRoundsNeeded = breakTeams >= 8 ? 3 : breakTeams >= 4 ? 2 : breakTeams >= 2 ? 1 : 0;
			const preliminaryRounds = totalRounds - breakRoundsNeeded;
			
			// Determine round type
			let roundType = "preliminary";
			if (formData.roundNumber > preliminaryRounds && breakRoundsNeeded > 0) {
				const breakRoundIndex = formData.roundNumber - preliminaryRounds;
				if (breakRoundsNeeded === 3) {
					roundType = breakRoundIndex === 1 ? "break" : breakRoundIndex === 2 ? "semi" : "final";
				} else if (breakRoundsNeeded === 2) {
					roundType = breakRoundIndex === 1 ? "semi" : "final";
				} else if (breakRoundsNeeded === 1) {
					roundType = "final";
				}
			}
			
			const res = await fetch(`/api/motions/tournament/${tournament._id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					round: formData.roundNumber, // Send round number directly
					motionText: formData.motionText,
					infoSlide: formData.infoSlide,
					motionType: formData.motionType,
					prepTime: formData.prepTime,
					roundType: roundType,
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Motion created successfully!", "success");
			onMotionCreated && onMotionCreated(data);
			handleClose();
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setFormData({
			roundNumber: 1,
			motionText: "",
			infoSlide: "",
			motionType: "open",
			prepTime: tournament?.format === "BP" ? 15 : 30,
		});
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
								<FiFileText size={24} />
								<Text fontSize="xl" fontWeight="bold" color={textColor}>
									Create Motion
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
							Add a debate motion for {tournament?.name}
						</Text>

						<Divider />

						{/* Round Number */}
						<FormControl isRequired>
							<FormLabel color={textColor} fontSize="sm" fontWeight="semibold">
								Round Number
							</FormLabel>
							<Select
								value={formData.roundNumber}
								onChange={(e) => setFormData(prev => ({ ...prev, roundNumber: parseInt(e.target.value) }))}
								color={textColor}
								borderColor={borderColor}
								_hover={{ borderColor: accentColor }}
							>
								{Array.from({ length: tournament?.numberOfRounds || 5 }, (_, i) => (
									<option key={i + 1} value={i + 1}>
										Round {i + 1}
									</option>
								))}
							</Select>
						</FormControl>

						{/* Motion Text */}
						<FormControl isRequired>
							<FormLabel color={textColor} fontSize="sm" fontWeight="semibold">
								Motion Text
							</FormLabel>
							<Textarea
								value={formData.motionText}
								onChange={(e) => setFormData(prev => ({ ...prev, motionText: e.target.value }))}
								placeholder="This House believes that..."
								rows={3}
								color={textColor}
								borderColor={borderColor}
								_hover={{ borderColor: accentColor }}
								_focus={{ borderColor: accentColor }}
							/>
						</FormControl>

						{/* Info Slide */}
						<FormControl>
							<FormLabel color={textColor} fontSize="sm" fontWeight="semibold">
								Info Slide (Optional)
							</FormLabel>
							<Textarea
								value={formData.infoSlide}
								onChange={(e) => setFormData(prev => ({ ...prev, infoSlide: e.target.value }))}
								placeholder="Additional context or information..."
								rows={3}
								color={textColor}
								borderColor={borderColor}
								_hover={{ borderColor: accentColor }}
								_focus={{ borderColor: accentColor }}
							/>
						</FormControl>

						{/* Motion Type */}
						<FormControl isRequired>
							<FormLabel color={textColor} fontSize="sm" fontWeight="semibold">
								Motion Type
							</FormLabel>
							<Select
								value={formData.motionType}
								onChange={(e) => setFormData(prev => ({ ...prev, motionType: e.target.value }))}
								color={textColor}
								borderColor={borderColor}
								_hover={{ borderColor: accentColor }}
							>
								<option value="open">Open Motion</option>
								<option value="closed">Closed Motion</option>
								<option value="semi-closed">Semi-Closed Motion</option>
							</Select>
						</FormControl>

						{/* Prep Time */}
						<FormControl isRequired>
							<FormLabel color={textColor} fontSize="sm" fontWeight="semibold">
								Preparation Time (minutes)
							</FormLabel>
							<Input
								type="number"
								value={formData.prepTime}
								onChange={(e) => setFormData(prev => ({ ...prev, prepTime: parseInt(e.target.value) }))}
								color={textColor}
								borderColor={borderColor}
								_hover={{ borderColor: accentColor }}
								_focus={{ borderColor: accentColor }}
							/>
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
								isDisabled={!formData.motionText.trim()}
							>
								Create Motion
							</Button>
						</HStack>
					</VStack>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};

export default CreateMotionModal;
