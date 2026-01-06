import {
	Box,
	Flex,
	Text,
	VStack,
	HStack,
	Button,
	Spinner,
	useColorModeValue,
	useDisclosure,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { FiPlus, FiX } from "react-icons/fi";
import TournamentCard from "../components/TournamentCard";
import CreateTournamentModal from "../components/CreateTournamentModal";
import useShowToast from "../hooks/useShowToast";

const CompetitionsPage = () => {
	const currentUser = useRecoilValue(userAtom);
	const showToast = useShowToast();
	const { isOpen, onOpen, onClose } = useDisclosure();

	const [tournaments, setTournaments] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeFilter, setActiveFilter] = useState(null);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const pillBg = useColorModeValue("gray.100", "rgba(255,255,255,0.06)");
	const pillHoverBg = useColorModeValue("gray.200", "rgba(255,255,255,0.1)");
	const pillActiveBg = useColorModeValue("purple.100", "rgba(128,90,213,0.2)");

	const filters = [
		{ label: "All", value: null },
		{ label: "Open", value: "registration" },
		{ label: "Ongoing", value: "ongoing" },
		{ label: "BP", value: "BP", type: "format" },
		{ label: "AP", value: "AP", type: "format" },
		{ label: "Archived", value: "archived", type: "archived" },
	];

	// Fetch tournaments
	useEffect(() => {
		const fetchTournaments = async () => {
			setIsLoading(true);
			try {
				// Build query parameters
				let queryParams = "";
				if (activeFilter) {
					const filter = filters.find((f) => f.value === activeFilter);
					if (filter?.type === "format") {
						queryParams = `?format=${activeFilter}`;
					} else if (filter?.type === "archived") {
						queryParams = `?archived=true`;
					} else {
						queryParams = `?status=${activeFilter}`;
					}
				}

				const res = await fetch(`/api/tournaments/feed${queryParams}`);
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				setTournaments(data);
			} catch (error) {
				showToast("Error", error.message, "error");
			} finally {
				setIsLoading(false);
			}
		};

		fetchTournaments();
	}, [showToast, activeFilter]);

	const handleTournamentCreated = (newTournament) => {
		setTournaments((prev) => [newTournament, ...prev]);
	};

	return (
		<Box>
			{/* Filter Pills */}
			<HStack spacing={2} py={4} flexWrap="wrap">
				{filters.map((filter) => (
					<Box
						key={filter.label}
						px={4}
						py={2}
						borderRadius="full"
						fontSize="sm"
						fontWeight="medium"
						cursor="pointer"
						transition="all 0.15s"
						bg={activeFilter === filter.value ? pillActiveBg : pillBg}
						color={activeFilter === filter.value ? "purple.500" : textColor}
						_hover={{ bg: activeFilter === filter.value ? pillActiveBg : pillHoverBg }}
						onClick={() => setActiveFilter(filter.value)}
					>
						{filter.label}
					</Box>
				))}
				<Box flex={1} />
				<Button
					leftIcon={<FiPlus />}
					colorScheme="purple"
					size="sm"
					borderRadius="full"
					onClick={onOpen}
				>
					Create
				</Button>
			</HStack>

			{/* Tournament List */}
			{isLoading ? (
				<Flex justify="center" py={10}>
					<Spinner size="lg" />
				</Flex>
			) : tournaments.length === 0 ? (
				<Flex justify="center" align="center" py={10}>
					<Text color={mutedText}>
						{activeFilter ? "No tournaments match this filter" : "No tournaments yet. Create the first one!"}
					</Text>
				</Flex>
			) : (
				<VStack spacing={4} align="stretch">
					{tournaments.map((tournament) => (
						<TournamentCard key={tournament._id} tournament={tournament} />
					))}
				</VStack>
			)}

			{/* Create Tournament Modal */}
			<CreateTournamentModal
				isOpen={isOpen}
				onClose={onClose}
				onTournamentCreated={handleTournamentCreated}
			/>
		</Box>
	);
};

export default CompetitionsPage;