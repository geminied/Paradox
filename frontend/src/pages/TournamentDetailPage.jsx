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
	Tabs,
	TabList,
	TabPanels,
	Tab,
	TabPanel,
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
	FiTrendingUp,
	FiAward,
} from "react-icons/fi";
import { format, formatDistanceToNowStrict } from "date-fns";
import useShowToast from "../hooks/useShowToast";
import EditTournamentModal from "../components/EditTournamentModal";
import MotionList from "../components/MotionList";
import RegisterTeamModal from "../components/RegisterTeamModal";
import TeamCard from "../components/TeamCard";
import JudgeAssignmentModal from "../components/JudgeAssignmentModal";
import StandingsPage from "./StandingsPage";
import BreakPage from "./BreakPage";

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
	const [teams, setTeams] = useState([]);
	const [loadingTeams, setLoadingTeams] = useState(false);

	const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
	const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
	const { isOpen: isRegisterTeamOpen, onOpen: onRegisterTeamOpen, onClose: onRegisterTeamClose } = useDisclosure();
	const { isOpen: isJudgeAssignmentOpen, onOpen: onJudgeAssignmentOpen, onClose: onJudgeAssignmentClose } = useDisclosure();

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

		const fetchTeams = async () => {
			setLoadingTeams(true);
			try {
				const res = await fetch(`/api/teams/tournament/${tournamentId}`);
				const data = await res.json();
				if (res.ok) {
					setTeams(data);
				}
			} catch (error) {
				console.error("Error fetching teams:", error);
			} finally {
				setLoadingTeams(false);
			}
		};

		fetchTournament();
		fetchTeams();
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
								<MenuItem 
									icon={<FiUsers />} 
									onClick={onJudgeAssignmentOpen}
									bg={cardBg}
									_hover={{ bg: hoverBg }}
								>
									Manage Judges
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
						<Text>{teams.length}/{tournament.maxTeams} teams</Text>
					</HStack>
					<HStack spacing={1}>
						<FiClock size={14} />
						<Text>{tournament.numberOfRounds} rounds</Text>
					</HStack>
				</HStack>

				{/* View Rounds Button - Only for ongoing/completed tournaments */}
				{(tournament.status === "ongoing" || tournament.status === "completed") && (
					<Button
						mt={4}
						w="full"
						colorScheme="blue"
						borderRadius="full"
						onClick={() => navigate(`/tournament/${tournamentId}/rounds`)}
					>
						View Rounds & Draw
					</Button>
				)}
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
					<Text fontSize="sm" color={textColor}>
						{tournament.speakerScoreRange?.min || 70} - {tournament.speakerScoreRange?.max || 80}
					</Text>
				</HStack>
				<HStack justify="space-between">
					<Text fontSize="sm" color={mutedText}>Registration deadline</Text>
					<Text fontSize="sm" color={textColor}>
						{tournament.registrationDeadline && !isNaN(new Date(tournament.registrationDeadline).getTime())
							? format(new Date(tournament.registrationDeadline), "MMM d, yyyy")
							: "Not set"}
					</Text>
				</HStack>
			</VStack>
		</Box>

		{/* Tabs for Motions, Teams, Standings */}
		<Tabs colorScheme="blue" variant="soft-rounded">
			<TabList mb={4}>
				<Tab>
					<HStack spacing={2}>
						<FiCalendar />
						<Text>Motions</Text>
					</HStack>
				</Tab>
				<Tab>
					<HStack spacing={2}>
						<FiUsers />
						<Text>Teams ({teams.length})</Text>
					</HStack>
				</Tab>
				<Tab>
					<HStack spacing={2}>
						<FiTrendingUp />
						<Text>Standings</Text>
					</HStack>
				</Tab>
				<Tab>
					<HStack spacing={2}>
						<FiAward />
						<Text>Break</Text>
					</HStack>
				</Tab>
			</TabList>

			<TabPanels>
				{/* Motions Tab */}
				<TabPanel p={0}>
					<Box
						bg={cardBg}
						border="1px"
						borderColor={borderColor}
						borderRadius="3xl"
						p={5}
					>
						<MotionList tournament={tournament} />
					</Box>
				</TabPanel>

				{/* Teams Tab */}
				<TabPanel p={0}>
					<Box
						bg={cardBg}
						border="1px"
						borderColor={borderColor}
						borderRadius="3xl"
						p={5}
					>
						<HStack justify="space-between" mb={4}>
							<Text fontWeight="semibold" fontSize="lg" color={textColor}>
								Registered Teams
							</Text>
							{!isCreator && tournament.status === "registration" && (
								<Button
									size="sm"
									colorScheme="blue"
									borderRadius="full"
									onClick={onRegisterTeamOpen}
								>
									Register Team
								</Button>
							)}
						</HStack>

						{loadingTeams ? (
							<Flex justify="center" py={8}>
								<Spinner />
							</Flex>
						) : teams.length === 0 ? (
							<Text color={mutedText} textAlign="center" py={8}>
								No teams registered yet
							</Text>
						) : (
							<VStack spacing={3} align="stretch">
								{teams.map((team) => (
									<TeamCard key={team._id} team={team} onView={() => {}} />
								))}
							</VStack>
						)}
					</Box>
				</TabPanel>

				{/* Standings Tab */}
				<TabPanel p={0}>
					<StandingsPage tournamentId={tournamentId} />
				</TabPanel>

				{/* Break Tab */}
				<TabPanel p={0}>
					<BreakPage 
						tournamentId={tournamentId} 
						tournament={tournament}
						isOrganizer={isCreator}
					/>
				</TabPanel>
			</TabPanels>
		</Tabs>

		{/* Register Team Modal */}
		<RegisterTeamModal
			isOpen={isRegisterTeamOpen}
			onClose={onRegisterTeamClose}
			tournament={tournament}
			onTeamRegistered={(newTeam) => {
				setTeams(prev => [...prev, newTeam]);
			}}
		/>

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

			{/* Judge Assignment Modal */}
			{isCreator && (
				<JudgeAssignmentModal
					isOpen={isJudgeAssignmentOpen}
					onClose={onJudgeAssignmentClose}
					tournament={tournament}
					onJudgeAdded={() => {
						// Refresh tournament to get updated judge list
						const fetchTournament = async () => {
							const res = await fetch(`/api/tournaments/${tournamentId}`);
							const data = await res.json();
							if (res.ok) setTournament(data);
						};
						fetchTournament();
					}}
				/>
			)}
		</Box>
	);
};

export default TournamentDetailPage;
