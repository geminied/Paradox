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

const CreateTournamentModal = ({ isOpen, onClose, onTournamentCreated }) => {
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		format: "BP",
		category: "open",
		startDate: "",
		endDate: "",
		registrationDeadline: "",
		maxTeams: 32,
		numberOfRounds: 5,
	});
	const [isLoading, setIsLoading] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const inputBg = useColorModeValue("transparent", "transparent");

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async () => {
		if (!formData.name.trim()) {
			showToast("Error", "Tournament name is required", "error");
			return;
		}
		if (!formData.startDate || !formData.endDate) {
			showToast("Error", "Start and end dates are required", "error");
			return;
		}

		// Use registration deadline if provided, otherwise use start date
		const registrationDeadline = formData.registrationDeadline || formData.startDate;

		setIsLoading(true);
		try {
			const res = await fetch("/api/tournaments/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					registrationDeadline,
					breakingTeams: 8,
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Tournament created!", "success");
			// Backend returns { tournament, rounds, message } so extract tournament
			onTournamentCreated(data.tournament || data);
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
			description: "",
			format: "BP",
			category: "open",
			startDate: "",
			endDate: "",
			registrationDeadline: "",
			maxTeams: 32,
			numberOfRounds: 5,
		});
		onClose();
	};

	const canPost = formData.name.trim() && formData.startDate && formData.endDate;

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
						New tournament
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

								{/* Tournament name */}
								<Input
									name="name"
									placeholder="Tournament name"
									value={formData.name}
									onChange={handleChange}
									variant="unstyled"
									fontSize="sm"
									color={textColor}
									_placeholder={{ color: mutedText }}
								/>

								{/* Description */}
								<Textarea
									name="description"
									placeholder="Add description..."
									value={formData.description}
									onChange={handleChange}
									variant="unstyled"
									fontSize="sm"
									color={textColor}
									_placeholder={{ color: mutedText }}
									resize="none"
									minH="40px"
								/>

								{/* Format & Category row */}
								<HStack spacing={3} w="full">
									<Select
										name="format"
										value={formData.format}
										onChange={handleChange}
										size="sm"
										borderRadius="full"
										borderColor={borderColor}
										color={textColor}
										flex={1}
									>
										<option value="BP">BP Format</option>
										<option value="AP">AP Format</option>
									</Select>
									<Select
										name="category"
										value={formData.category}
										onChange={handleChange}
										size="sm"
										borderRadius="full"
										borderColor={borderColor}
										color={textColor}
										flex={1}
									>
										<option value="school">School</option>
										<option value="college">College</option>
										<option value="open">Open</option>
										<option value="novice">Novice</option>
									</Select>
								</HStack>

								{/* Date row */}
								<HStack spacing={3} w="full">
									<VStack align="start" spacing={1} flex={1}>
										<Text fontSize="xs" color={mutedText}>Tournament Start</Text>
										<Input
											name="startDate"
											type="date"
											value={formData.startDate}
											onChange={handleChange}
											size="sm"
											borderRadius="lg"
											borderColor={borderColor}
											color={textColor}
										/>
									</VStack>
									<VStack align="start" spacing={1} flex={1}>
										<Text fontSize="xs" color={mutedText}>Tournament End</Text>
										<Input
											name="endDate"
											type="date"
											value={formData.endDate}
											onChange={handleChange}
											size="sm"
											borderRadius="lg"
											borderColor={borderColor}
											color={textColor}
										/>
									</VStack>
								</HStack>

								{/* Registration Deadline */}
								<VStack align="start" spacing={1} w="full">
									<Text fontSize="xs" color={mutedText}>Team Registration Closes</Text>
									<Input
										name="registrationDeadline"
										type="date"
										value={formData.registrationDeadline}
										onChange={handleChange}
										placeholder="Leave empty to use tournament start date"
										size="sm"
										borderRadius="lg"
										borderColor={borderColor}
										color={textColor}
									/>
								</VStack>

								{/* Settings row */}
								<HStack spacing={3} w="full">
									<VStack align="start" spacing={1} flex={1}>
										<Text fontSize="xs" color={mutedText}>Max teams</Text>
										<Input
											name="maxTeams"
											type="number"
											value={formData.maxTeams}
											onChange={handleChange}
											size="sm"
											borderRadius="lg"
											borderColor={borderColor}
											color={textColor}
										/>
									</VStack>
									<VStack align="start" spacing={1} flex={1}>
										<Text fontSize="xs" color={mutedText}>Rounds</Text>
										<Input
											name="numberOfRounds"
											type="number"
											value={formData.numberOfRounds}
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
						Create
					</Button>
				</Flex>
			</ModalContent>
		</Modal>
	);
};

export default CreateTournamentModal;
