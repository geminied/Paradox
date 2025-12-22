import {
	Box,
	Flex,
	Text,
	VStack,
	HStack,
	Badge,
	Button,
	Spinner,
	Avatar,
	Menu,
	MenuButton,
	MenuList,
	MenuItem,
	IconButton,
	useColorModeValue,
	useDisclosure,
	AlertDialog,
	AlertDialogBody,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogContent,
	AlertDialogOverlay,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { 
	FiArrowLeft, 
	FiCalendar, 
	FiUsers, 
	FiClock, 
	FiEdit2, 
	FiTrash2,
	FiMoreVertical,
	FiPlay,
	FiCheckCircle,
	FiXCircle,
} from "react-icons/fi";
import { format, formatDistanceToNowStrict } from "date-fns";
import useShowToast from "../hooks/useShowToast";
import EditTournamentModal from "../components/EditTournamentModal";
import MotionList from "../components/MotionList";

const TournamentDetailPage = () => {
	const { tournamentId } = useParams();
	const navigate = useNavigate();
	const currentUser = useRecoilValue(userAtom);
	const showToast = useShowToast();
	const cancelRef = useRef();

	const [tournament, setTournament] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

	const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
	const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const hoverBg = useColorModeValue("gray.50", "#1a1a1a");

	const isCreator = currentUser?._id === tournament?.creator?._id;

	useEffect(() => {
		const fetchTournament = async () => {
			setIsLoading(true);
			try {
				const res = await fetch(`/api/tournaments/${tournamentId}`);
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				setTournament(data);
			} catch (error) {
				showToast("Error", error.message, "error");
				navigate("/competitions");
			} finally {
				setIsLoading(false);
			}
		};

		fetchTournament();
	}, [tournamentId, showToast, navigate]);

	const getStatusColor = (status) => {
		switch (status) {
			case "draft": return "gray";
			case "registration": return "blue";
			case "ongoing": return "green";
			case "completed": return "purple";
			case "cancelled": return "red";
			default: return "gray";
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const res = await fetch(`/api/tournaments/${tournamentId}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Tournament deleted successfully", "success");
			navigate("/competitions");
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsDeleting(false);
			onDeleteClose();
		}
	};

	const handleStatusUpdate = async (newStatus) => {
		setIsUpdatingStatus(true);
		try {
			const res = await fetch(`/api/tournaments/${tournamentId}/status`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			setTournament(data);
			showToast("Success", `Tournament status updated to ${newStatus}`, "success");
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const handleTournamentUpdated = (updatedTournament) => {
		setTournament(updatedTournament);
	};

	if (isLoading) {
		return (
			<Flex justify="center" py={10} pt={6}>
				<Spinner size="lg" />
			</Flex>
		);
	}

	if (!tournament) {
		return (
			<Box textAlign="center" py={10} pt={6}>
				<Text color={mutedText}>Tournament not found</Text>
			</Box>
		);
	}

	const timeAgo = formatDistanceToNowStrict(new Date(tournament.createdAt), { addSuffix: false });

	return (
		<Box pt={6} pb={8}>
			{/* Back button */}
			<HStack
				mb={4}
				cursor="pointer"
				onClick={() => navigate("/competitions")}
				_hover={{ color: textColor }}
				color={mutedText}
			>
				<FiArrowLeft size={18} />
				<Text fontSize="sm">Back to competitions</Text>
			</HStack>

			{/* Tournament Header Card */}
			<Box
				bg={cardBg}
				border="1px"
				borderColor={borderColor}
				borderRadius="3xl"
				p={5}
				mb={4}
			>
				{/* Creator info & Actions */}
				<HStack spacing={3} mb={3} justify="space-between">
					<HStack spacing={3}>
						<Avatar size="sm" name={tournament.creator?.name} />
						<Flex align="center" gap={2} flexWrap="wrap">
							<Text fontWeight="semibold" fontSize="sm" color={textColor}>
								{tournament.creator?.name}
							</Text>
							<Text fontSize="xs" color={mutedText}>
								@{tournament.creator?.username}
							</Text>
							<Text fontSize="xs" color={mutedText}>·</Text>
							<Text fontSize="xs" color={mutedText}>
								{timeAgo}
							</Text>
						</Flex>
					</HStack>

					{isCreator && (
						<Menu>
							<MenuButton
								as={IconButton}
								icon={<FiMoreVertical />}
								variant="ghost"
								size="sm"
								color={mutedText}
							/>
							<MenuList bg={cardBg} borderColor={borderColor}>
								<MenuItem 
									icon={<FiEdit2 />} 
									onClick={onEditOpen}
									bg={cardBg}
									_hover={{ bg: hoverBg }}
								>
									Edit
								</MenuItem>
								{tournament.status === "draft" && (
									<MenuItem 
										icon={<FiPlay />} 
										onClick={() => handleStatusUpdate("registration")}
										bg={cardBg}
										_hover={{ bg: hoverBg }}
										isDisabled={isUpdatingStatus}
									>
										Open Registration
									</MenuItem>
								)}
								{tournament.status === "registration" && (
									<MenuItem 
										icon={<FiPlay />} 
										onClick={() => handleStatusUpdate("ongoing")}
										bg={cardBg}
										_hover={{ bg: hoverBg }}
										isDisabled={isUpdatingStatus}
									>
										Start Tournament
									</MenuItem>
								)}
								{tournament.status === "ongoing" && (
									<MenuItem 
										icon={<FiCheckCircle />} 
										onClick={() => handleStatusUpdate("completed")}
										bg={cardBg}
										_hover={{ bg: hoverBg }}
										isDisabled={isUpdatingStatus}
									>
										Complete
									</MenuItem>
								)}
								{!["completed", "cancelled"].includes(tournament.status) && (
									<MenuItem 
										icon={<FiXCircle />} 
										onClick={() => handleStatusUpdate("cancelled")}
										bg={cardBg}
										_hover={{ bg: hoverBg }}
										color="red.500"
										isDisabled={isUpdatingStatus}
									>
										Cancel
									</MenuItem>
								)}
								<MenuItem 
									icon={<FiTrash2 />} 
									onClick={onDeleteOpen}
									bg={cardBg}
									_hover={{ bg: hoverBg }}
									color="red.500"
								>
									Delete
								</MenuItem>
							</MenuList>
						</Menu>
					)}
				</HStack>

				{/* Badges */}
				<HStack spacing={2} mb={3} flexWrap="wrap">
					<Badge colorScheme="purple" variant="subtle" fontSize="xs" borderRadius="full" px={2}>
						{tournament.format === "BP" ? "British Parliamentary" : "Asian Parliamentary"}
					</Badge>
					<Badge 
						colorScheme={getStatusColor(tournament.status)} 
						variant="subtle"
						fontSize="xs" 
						borderRadius="full" 
						px={2}
					>
						{tournament.status}
					</Badge>
					<Badge colorScheme="orange" variant="subtle" fontSize="xs" borderRadius="full" px={2}>
						{tournament.category}
					</Badge>
				</HStack>

				{/* Title */}
				<Text fontWeight="bold" fontSize="xl" color={textColor} mb={2}>
					{tournament.name}
				</Text>

				{/* Description */}
				{tournament.description && (
					<Text fontSize="sm" color={mutedText} mb={4}>
						{tournament.description}
					</Text>
				)}

				{/* Info row */}
				<HStack spacing={6} pt={2} color={mutedText} fontSize="sm" flexWrap="wrap">
					<HStack spacing={1}>
						<FiCalendar size={14} />
						<Text>{format(new Date(tournament.startDate), "MMM d")} - {format(new Date(tournament.endDate), "MMM d, yyyy")}</Text>
					</HStack>
					<HStack spacing={1}>
						<FiUsers size={14} />
						<Text>{tournament.participants?.length || 0}/{tournament.maxTeams} teams</Text>
					</HStack>
					<HStack spacing={1}>
						<FiClock size={14} />
						<Text>{tournament.numberOfRounds} rounds</Text>
					</HStack>
				</HStack>
			</Box>

			{/* Tournament Details Card */}
			<Box
				bg={cardBg}
				border="1px"
				borderColor={borderColor}
				borderRadius="3xl"
				p={5}
				mb={4}
			>
				<Text fontWeight="semibold" fontSize="sm" color={textColor} mb={3}>
					Tournament Details
				</Text>
				<VStack align="stretch" spacing={2}>
					<HStack justify="space-between">
						<Text fontSize="sm" color={mutedText}>Speakers per team</Text>
						<Text fontSize="sm" color={textColor}>{tournament.speakersPerTeam}</Text>
					</HStack>
					<HStack justify="space-between">
						<Text fontSize="sm" color={mutedText}>Breaking teams</Text>
						<Text fontSize="sm" color={textColor}>Top {tournament.breakingTeams}</Text>
					</HStack>
					<HStack justify="space-between">
						<Text fontSize="sm" color={mutedText}>Speaker score range</Text>
						<Text fontSize="sm" color={textColor}>{tournament.speakerScoreRange?.min} - {tournament.speakerScoreRange?.max}</Text>
					</HStack>
					<HStack justify="space-between">
						<Text fontSize="sm" color={mutedText}>Registration deadline</Text>
						<Text fontSize="sm" color={textColor}>{format(new Date(tournament.registrationDeadline), "MMM d, yyyy")}</Text>
					</HStack>
				</VStack>
			</Box>

			{/* Motions Section */}
			<Box
				bg={cardBg}
				border="1px"
				borderColor={borderColor}
				borderRadius="3xl"
				p={5}
			>
				<MotionList tournament={tournament} />
			</Box>

			{/* Edit Modal */}
			{isCreator && (
				<EditTournamentModal
					isOpen={isEditOpen}
					onClose={onEditClose}
					tournament={tournament}
					onTournamentUpdated={handleTournamentUpdated}
				/>
			)}

			{/* Delete Confirmation */}
			<AlertDialog
				isOpen={isDeleteOpen}
				leastDestructiveRef={cancelRef}
				onClose={onDeleteClose}
			>
				<AlertDialogOverlay>
					<AlertDialogContent bg={cardBg} borderRadius="2xl">
						<AlertDialogHeader fontSize="lg" fontWeight="bold" color={textColor}>
							Delete Tournament
						</AlertDialogHeader>
						<AlertDialogBody color={mutedText}>
							Are you sure? This cannot be undone.
						</AlertDialogBody>
						<AlertDialogFooter>
							<Button ref={cancelRef} onClick={onDeleteClose} borderRadius="full">
								Cancel
							</Button>
							<Button 
								colorScheme="red" 
								onClick={handleDelete} 
								ml={3}
								isLoading={isDeleting}
								borderRadius="full"
							>
								Delete
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialogOverlay>
			</AlertDialog>
		</Box>
	);
};

export default TournamentDetailPage;
