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
	Textarea,
	Select,
	VStack,
	HStack,
	Avatar,
	Divider,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";

const AddMotionModal = ({ isOpen, onClose, tournament, onMotionAdded }) => {
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();

	const [formData, setFormData] = useState({
		round: 1,
		roundType: "preliminary",
		motionText: "",
		infoSlide: "",
		prepTime: tournament?.format === "AP" ? 30 : 15,
		scheduledReleaseTime: "",
	});
	const [isLoading, setIsLoading] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async () => {
		if (!formData.motionText.trim()) {
			showToast("Error", "Motion text is required", "error");
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch(`/api/motions/tournament/${tournament._id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					round: parseInt(formData.round),
					prepTime: parseInt(formData.prepTime),
					scheduledReleaseTime: formData.scheduledReleaseTime || null,
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Motion added!", "success");
			onMotionAdded(data);
			handleClose();
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setFormData({
			round: 1,
			roundType: "preliminary",
			motionText: "",
			infoSlide: "",
			prepTime: tournament?.format === "AP" ? 30 : 15,
			scheduledReleaseTime: "",
		});
		onClose();
	};

	const canPost = formData.motionText.trim();

	return (
		<Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
			<ModalOverlay bg="blackAlpha.700" />
			<ModalContent
				bg={cardBg}
				border="1px"
				borderColor={borderColor}
				borderRadius="2xl"
				mx={4}
				maxW="500px"
			>
				{/* Header */}
				<Flex justify="space-between" align="center" p={4}>
					<Text
						color={mutedText}
						fontSize="sm"
						cursor="pointer"
						onClick={handleClose}
						_hover={{ color: textColor }}
					>
						Cancel
					</Text>
					<Text fontWeight="semibold" color={textColor}>
						Add motion
					</Text>
					<Box w="50px" />
				</Flex>

				<Divider borderColor={borderColor} />

				<ModalBody p={4}>
					<VStack spacing={4} align="stretch">
						{/* User row */}
						<HStack spacing={3} align="flex-start">
							<Avatar size="sm" name={user?.name} mt={1} />
							<VStack align="start" spacing={3} flex={1}>
								<Text fontWeight="semibold" fontSize="sm" color={textColor}>
									{user?.username || "anonymous"}
								</Text>

								{/* Round selection */}
								<HStack spacing={3} w="full">
									<VStack align="start" spacing={1} flex={1}>
										<Text fontSize="xs" color={mutedText}>Round</Text>
										<Input
											name="round"
											type="number"
											value={formData.round}
											onChange={handleChange}
											size="sm"
											borderRadius="lg"
											borderColor={borderColor}
											color={textColor}
											min={1}
										/>
									</VStack>
									<VStack align="start" spacing={1} flex={1}>
										<Text fontSize="xs" color={mutedText}>Type</Text>
										<Select
											name="roundType"
											value={formData.roundType}
											onChange={handleChange}
											size="sm"
											borderRadius="full"
											borderColor={borderColor}
											color={textColor}
										>
											<option value="preliminary">Preliminary</option>
											<option value="octo">Octo-finals</option>
											<option value="quarterfinal">Quarter-finals</option>
											<option value="semifinal">Semi-finals</option>
											<option value="final">Final</option>
										</Select>
									</VStack>
								</HStack>

								{/* Motion text */}
								<Textarea
									name="motionText"
									placeholder="This House Would..."
									value={formData.motionText}
									onChange={handleChange}
									variant="unstyled"
									fontSize="sm"
									color={textColor}
									_placeholder={{ color: mutedText }}
									resize="none"
									minH="60px"
								/>

								{/* Info slide */}
								<Textarea
									name="infoSlide"
									placeholder="Info slide (optional)..."
									value={formData.infoSlide}
									onChange={handleChange}
									fontSize="sm"
									color={textColor}
									_placeholder={{ color: mutedText }}
									resize="none"
									minH="40px"
									borderRadius="lg"
									borderColor={borderColor}
								/>

								{/* Prep time & scheduled release */}
								<HStack spacing={3} w="full">
									<VStack align="start" spacing={1} flex={1}>
										<Text fontSize="xs" color={mutedText}>Prep (min)</Text>
										<Input
											name="prepTime"
											type="number"
											value={formData.prepTime}
											onChange={handleChange}
											size="sm"
											borderRadius="lg"
											borderColor={borderColor}
											color={textColor}
										/>
									</VStack>
									<VStack align="start" spacing={1} flex={1}>
										<Text fontSize="xs" color={mutedText}>Schedule release</Text>
										<Input
											name="scheduledReleaseTime"
											type="datetime-local"
											value={formData.scheduledReleaseTime}
											onChange={handleChange}
											size="sm"
											borderRadius="lg"
											borderColor={borderColor}
											color={textColor}
										/>
									</VStack>
								</HStack>
							</VStack>
						</HStack>
					</VStack>
				</ModalBody>

				<Divider borderColor={borderColor} />

				{/* Footer */}
				<Flex justify="flex-end" align="center" p={4}>
					<Button
						bg={canPost ? textColor : "transparent"}
						color={canPost ? cardBg : mutedText}
						border={canPost ? "none" : "1px"}
						borderColor={borderColor}
						fontWeight="semibold"
						borderRadius="3xl"
						px={6}
						size="sm"
						_hover={{ opacity: canPost ? 0.8 : 1 }}
						isDisabled={!canPost}
						isLoading={isLoading}
						onClick={handleSubmit}
					>
						Add
					</Button>
				</Flex>
			</ModalContent>
		</Modal>
	);
};

export default AddMotionModal;
