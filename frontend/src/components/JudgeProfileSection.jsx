import {
	Box,
	Button,
	Divider,
	FormControl,
	FormLabel,
	Heading,
	HStack,
	Input,
	Select,
	Switch,
	Tag,
	TagCloseButton,
	TagLabel,
	Text,
	Textarea,
	useColorModeValue,
	VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiAward, FiCheck, FiX } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const JudgeProfileSection = ({ user, onUpdate }) => {
	const showToast = useShowToast();
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const [judgeData, setJudgeData] = useState({
		isActive: user?.judgeProfile?.isActive || false,
		experience: user?.judgeProfile?.experience || "novice",
		bio: user?.judgeProfile?.bio || "",
		conflictInstitutions: user?.judgeProfile?.conflictInstitutions || [],
	});

	const [newConflict, setNewConflict] = useState("");

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("black", "white");
	const mutedText = useColorModeValue("gray.500", "#777777");
	const accentColor = useColorModeValue("black", "white");

	const handleToggleActive = async (e) => {
		const newActiveStatus = e.target.checked;
		
		try {
			const res = await fetch("/api/users/judge-profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					isActive: newActiveStatus,
					experience: judgeData.experience,
					bio: judgeData.bio,
					conflictInstitutions: judgeData.conflictInstitutions,
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			setJudgeData((prev) => ({ ...prev, isActive: newActiveStatus }));
			onUpdate && onUpdate(data);
			showToast(
				"Success",
				newActiveStatus ? "Judge profile activated" : "Judge profile deactivated",
				"success"
			);
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	const handleAddConflict = () => {
		if (!newConflict.trim()) return;
		if (judgeData.conflictInstitutions.includes(newConflict.trim())) {
			showToast("Error", "Institution already added", "error");
			return;
		}

		setJudgeData((prev) => ({
			...prev,
			conflictInstitutions: [...prev.conflictInstitutions, newConflict.trim()],
		}));
		setNewConflict("");
	};

	const handleRemoveConflict = (institution) => {
		setJudgeData((prev) => ({
			...prev,
			conflictInstitutions: prev.conflictInstitutions.filter((i) => i !== institution),
		}));
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			const res = await fetch("/api/users/judge-profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(judgeData),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			onUpdate && onUpdate(data);
			showToast("Success", "Judge profile updated successfully", "success");
			setIsEditing(false);
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Box
			bg={cardBg}
			border="1px"
			borderColor={borderColor}
			borderRadius="3xl"
			p={6}
		>
			<VStack align="stretch" spacing={4}>
				{/* Header */}
				<HStack justify="space-between">
					<HStack>
						<FiAward size={20} />
						<Heading size="md" color={textColor}>
							Judge Profile
						</Heading>
					</HStack>
					{!isEditing && (
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setIsEditing(true)}
							color={accentColor}
						>
							Edit
						</Button>
					)}
				</HStack>

				<Divider />

				{/* Active Toggle */}
				<FormControl display="flex" alignItems="center">
					<FormLabel htmlFor="judge-active" mb="0" color={textColor}>
						Active as Judge
					</FormLabel>
					<Switch
						id="judge-active"
						isChecked={judgeData.isActive}
						onChange={handleToggleActive}
						colorScheme="green"
						size="lg"
					/>
				</FormControl>

				{judgeData.isActive && (
					<>
						{/* Experience Level */}
						<FormControl>
							<FormLabel color={textColor}>Experience Level</FormLabel>
							<Select
								value={judgeData.experience}
								onChange={(e) =>
									setJudgeData((prev) => ({ ...prev, experience: e.target.value }))
								}
								isDisabled={!isEditing}
								color={textColor}
								borderColor={borderColor}
								_hover={{ borderColor: accentColor }}
							>
								<option value="novice">Novice (0-1 years)</option>
								<option value="intermediate">Intermediate (1-3 years)</option>
								<option value="experienced">Experienced (3-5 years)</option>
								<option value="expert">Expert (5+ years)</option>
							</Select>
						</FormControl>

						{/* Bio */}
						<FormControl>
							<FormLabel color={textColor}>Bio / Judging Philosophy</FormLabel>
							<Textarea
								value={judgeData.bio}
								onChange={(e) =>
									setJudgeData((prev) => ({ ...prev, bio: e.target.value }))
								}
								placeholder="Describe your judging experience and philosophy..."
								rows={4}
								isDisabled={!isEditing}
								color={textColor}
								borderColor={borderColor}
								_hover={{ borderColor: accentColor }}
								_focus={{ borderColor: accentColor }}
							/>
						</FormControl>

						{/* Conflict Institutions */}
						<FormControl>
							<FormLabel color={textColor}>Conflict Institutions</FormLabel>
							<Text fontSize="sm" color={mutedText} mb={2}>
								Add institutions you have conflicts with (e.g., your own institution)
							</Text>

							{isEditing && (
								<HStack mb={2}>
									<Input
										value={newConflict}
										onChange={(e) => setNewConflict(e.target.value)}
										placeholder="Institution name"
										color={textColor}
										borderColor={borderColor}
										_hover={{ borderColor: accentColor }}
										_focus={{ borderColor: accentColor }}
										onKeyPress={(e) => {
											if (e.key === "Enter") {
												handleAddConflict();
											}
										}}
									/>
									<Button onClick={handleAddConflict} colorScheme="blue" size="sm">
										Add
									</Button>
								</HStack>
							)}

							<HStack spacing={2} flexWrap="wrap">
								{judgeData.conflictInstitutions.length === 0 ? (
									<Text fontSize="sm" color={mutedText}>
										No conflict institutions added
									</Text>
								) : (
									judgeData.conflictInstitutions.map((institution) => (
										<Tag
											key={institution}
											size="md"
											borderRadius="full"
											variant="subtle"
											colorScheme="red"
										>
											<TagLabel>{institution}</TagLabel>
											{isEditing && (
												<TagCloseButton
													onClick={() => handleRemoveConflict(institution)}
												/>
											)}
										</Tag>
									))
								)}
							</HStack>
						</FormControl>

						{/* Action Buttons */}
						{isEditing && (
							<HStack justify="flex-end" pt={2}>
								<Button
									variant="ghost"
									leftIcon={<FiX />}
									onClick={() => setIsEditing(false)}
								>
									Cancel
								</Button>
								<Button
									colorScheme="blue"
									leftIcon={<FiCheck />}
									onClick={handleSave}
									isLoading={isSaving}
								>
									Save Changes
								</Button>
							</HStack>
						)}
					</>
				)}
			</VStack>
		</Box>
	);
};

export default JudgeProfileSection;
