import {
	Box,
	Flex,
	Text,
	Badge,
	Button,
	HStack,
	VStack,
	IconButton,
	useColorModeValue,
	useDisclosure,
	AlertDialog,
	AlertDialogBody,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogContent,
	AlertDialogOverlay,
	Input,
	Collapse,
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { FiClock, FiSend, FiArchive, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const MotionCard = ({ motion, isOrganizer, onUpdate, onDelete }) => {
	const showToast = useShowToast();
	const [isLoading, setIsLoading] = useState(false);
	const [showInfoSlide, setShowInfoSlide] = useState(false);
	const [scheduledTime, setScheduledTime] = useState("");
	const [showScheduler, setShowScheduler] = useState(false);
	
	const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
	const cancelRef = useRef();

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	const getRoundLabel = () => {
		if (motion.roundType === "preliminary") {
			return `Round ${motion.round}`;
		}
		const labels = {
			octo: "Octo-finals",
			quarterfinal: "Quarter-finals",
			semifinal: "Semi-finals",
			final: "Grand Final",
		};
		return labels[motion.roundType] || motion.roundType;
	};

	const handleRelease = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/motions/${motion._id}/release`, {
				method: "PATCH",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Motion released!", "success");
			onUpdate(data);
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSchedule = async () => {
		if (!scheduledTime) {
			showToast("Error", "Please select a time", "error");
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch(`/api/motions/${motion._id}/schedule`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ scheduledReleaseTime: scheduledTime }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Release scheduled!", "success");
			onUpdate(data);
			setShowScheduler(false);
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleArchive = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/motions/${motion._id}/archive`, {
				method: "PATCH",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Motion archived!", "success");
			onUpdate(data);
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/motions/${motion._id}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Motion deleted!", "success");
			onDelete(motion._id);
			onDeleteClose();
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Box
				bg={cardBg}
				border="1px"
				borderColor={borderColor}
				borderRadius="3xl"
				p={5}
			>
				{/* Header */}
				<Flex justify="space-between" align="center" mb={3}>
					<HStack spacing={2}>
						<Text fontWeight="semibold" color={textColor}>
							{getRoundLabel()}
						</Text>
						{motion.isReleased ? (
							<Badge colorScheme="green" borderRadius="full" px={2}>
								Released
							</Badge>
						) : motion.scheduledReleaseTime ? (
							<Badge colorScheme="yellow" borderRadius="full" px={2}>
								Scheduled
							</Badge>
						) : (
							<Badge colorScheme="gray" borderRadius="full" px={2}>
								Draft
							</Badge>
						)}
						{motion.isArchived && (
							<Badge colorScheme="purple" borderRadius="full" px={2}>
								Archived
							</Badge>
						)}
					</HStack>

					<Text fontSize="xs" color={mutedText}>
						{motion.prepTime} min prep
					</Text>
				</Flex>

				{/* Motion text */}
				<Text color={textColor} fontSize="md" mb={3}>
					{motion.motionText}
				</Text>

				{/* Info slide toggle */}
				{motion.infoSlide && (
					<Box mb={3}>
						<Button
							variant="ghost"
							size="xs"
							color={mutedText}
							onClick={() => setShowInfoSlide(!showInfoSlide)}
							rightIcon={showInfoSlide ? <FiChevronUp /> : <FiChevronDown />}
							px={0}
						>
							Info slide
						</Button>
						<Collapse in={showInfoSlide}>
							<Box
								mt={2}
								p={3}
								bg={useColorModeValue("gray.50", "#1a1a1a")}
								borderRadius="xl"
							>
								<Text fontSize="sm" color={mutedText}>
									{motion.infoSlide}
								</Text>
							</Box>
						</Collapse>
					</Box>
				)}

				{/* Release time info */}
				{motion.isReleased && motion.releaseTime && (
					<Text fontSize="xs" color={mutedText} mb={3}>
						Released {formatDistanceToNowStrict(new Date(motion.releaseTime))} ago
					</Text>
				)}
				{motion.scheduledReleaseTime && !motion.isReleased && (
					<Text fontSize="xs" color={mutedText} mb={3}>
						Scheduled for {new Date(motion.scheduledReleaseTime).toLocaleString()}
					</Text>
				)}

				{/* Actions for organizer */}
				{isOrganizer && !motion.isReleased && (
					<VStack align="stretch" spacing={2}>
						{/* Schedule time input */}
						<Collapse in={showScheduler}>
							<HStack mb={2}>
								<Input
									type="datetime-local"
									size="sm"
									borderRadius="lg"
									borderColor={borderColor}
									value={scheduledTime}
									onChange={(e) => setScheduledTime(e.target.value)}
								/>
								<Button
									size="sm"
									borderRadius="full"
									onClick={handleSchedule}
									isLoading={isLoading}
								>
									Set
								</Button>
							</HStack>
						</Collapse>

						<HStack spacing={2}>
							<Button
								size="sm"
								borderRadius="full"
								leftIcon={<FiSend />}
								onClick={handleRelease}
								isLoading={isLoading}
								flex={1}
							>
								Release Now
							</Button>
							<IconButton
								size="sm"
								borderRadius="full"
								icon={<FiClock />}
								onClick={() => setShowScheduler(!showScheduler)}
								aria-label="Schedule release"
							/>
							<IconButton
								size="sm"
								borderRadius="full"
								icon={<FiTrash2 />}
								onClick={onDeleteOpen}
								aria-label="Delete motion"
								colorScheme="red"
								variant="ghost"
							/>
						</HStack>
					</VStack>
				)}

				{/* Archive action for released motions */}
				{isOrganizer && motion.isReleased && !motion.isArchived && (
					<Button
						size="sm"
						borderRadius="full"
						leftIcon={<FiArchive />}
						onClick={handleArchive}
						isLoading={isLoading}
						variant="outline"
					>
						Archive Motion
					</Button>
				)}
			</Box>

			{/* Delete confirmation */}
			<AlertDialog
				isOpen={isDeleteOpen}
				leastDestructiveRef={cancelRef}
				onClose={onDeleteClose}
			>
				<AlertDialogOverlay>
					<AlertDialogContent bg={cardBg} borderRadius="2xl">
						<AlertDialogHeader color={textColor}>Delete Motion</AlertDialogHeader>
						<AlertDialogBody color={mutedText}>
							Are you sure? This action cannot be undone.
						</AlertDialogBody>
						<AlertDialogFooter>
							<Button ref={cancelRef} onClick={onDeleteClose} borderRadius="full">
								Cancel
							</Button>
							<Button
								colorScheme="red"
								onClick={handleDelete}
								ml={3}
								borderRadius="full"
								isLoading={isLoading}
							>
								Delete
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialogOverlay>
			</AlertDialog>
		</>
	);
};

export default MotionCard;
