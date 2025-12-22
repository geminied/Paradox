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
import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";

const EditTournamentModal = ({ isOpen, onClose, tournament, onTournamentUpdated }) => {
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

	useEffect(() => {
		if (tournament) {
			setFormData({
				name: tournament.name || "",
				description: tournament.description || "",
				format: tournament.format || "BP",
				category: tournament.category || "open",
				startDate: tournament.startDate ? tournament.startDate.split("T")[0] : "",
				endDate: tournament.endDate ? tournament.endDate.split("T")[0] : "",
				registrationDeadline: tournament.registrationDeadline ? tournament.registrationDeadline.split("T")[0] : "",
				maxTeams: tournament.maxTeams || 32,
				numberOfRounds: tournament.numberOfRounds || 5,
			});
		}
	}, [tournament]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async () => {
		if (!formData.name.trim()) {
			showToast("Error", "Tournament name is required", "error");
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch(`/api/tournaments/${tournament._id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Tournament updated!", "success");
			onTournamentUpdated(data);
			onClose();
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const canSave = formData.name.trim();

	return (
		<Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
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
						onClick={onClose}
						_hover={{ color: textColor }}
					>
						Cancel
					</Text>
					<Text fontWeight="semibold" color={textColor}>
						Edit tournament
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
										<Text fontSize="xs" color={mutedText}>Start Date</Text>
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
										<Text fontSize="xs" color={mutedText}>End Date</Text>
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
									<Text fontSize="xs" color={mutedText}>Registration Deadline (Optional)</Text>
									<Input
										name="registrationDeadline"
										type="date"
										value={formData.registrationDeadline}
										onChange={handleChange}
										placeholder="Defaults to start date"
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
						bg={canSave ? textColor : "transparent"}
						color={canSave ? cardBg : mutedText}
						border={canSave ? "none" : "1px"}
						borderColor={borderColor}
						fontWeight="semibold"
						borderRadius="3xl"
						px={6}
						size="sm"
						_hover={{ opacity: canSave ? 0.8 : 1 }}
						isDisabled={!canSave}
						isLoading={isLoading}
						onClick={handleSubmit}
					>
						Save
					</Button>
				</Flex>
			</ModalContent>
		</Modal>
	);
};

export default EditTournamentModal;
