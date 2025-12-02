import {
	Box,
	Flex,
	Text,
	VStack,
	HStack,
	Spinner,
	Badge,
	useDisclosure,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import DebateCard from "../components/DebateCard";
import CreateDebateModal from "../components/CreateDebateModal";
import useShowToast from "../hooks/useShowToast";
import { FiX } from "react-icons/fi";

const HomePage = ({ categoryFilter, setCategoryFilter }) => {
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();
	const { isOpen, onOpen, onClose } = useDisclosure();
	
	const [debates, setDebates] = useState([]);
	const [filteredDebates, setFilteredDebates] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const hoverBg = useColorModeValue("gray.50", "#1a1a1a");

	// Fetch debates on mount
	useEffect(() => {
		const fetchDebates = async () => {
			setIsLoading(true);
			try {
				const res = await fetch("/api/debates/feed");
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				setDebates(data);
			} catch (error) {
				showToast("Error", error.message, "error");
			} finally {
				setIsLoading(false);
			}
		};

		fetchDebates();
	}, [showToast]);

	// Filter debates when categoryFilter changes
	useEffect(() => {
		if (categoryFilter) {
			const filtered = debates.filter(
				(d) => d.category?.toLowerCase() === categoryFilter.toLowerCase()
			);
			setFilteredDebates(filtered);
		} else {
			setFilteredDebates(debates);
		}
	}, [categoryFilter, debates]);

	const handleDebateCreated = (newDebate) => {
		setDebates([newDebate, ...debates]);
	};

	const displayedDebates = categoryFilter ? filteredDebates : debates;

	return (
		<Box>
			{/* Category Filter Banner */}
			{categoryFilter && (
				<Box
					bg={cardBg}
					border="1px"
					borderColor="purple.500"
					borderRadius="xl"
					p={3}
					mb={4}
				>
					<HStack justify="space-between">
						<HStack spacing={2}>
							<Text fontSize="sm" color={mutedText}>
								Showing debates in:
							</Text>
							<Badge colorScheme="purple" borderRadius="full" px={2}>
								{categoryFilter}
							</Badge>
						</HStack>
						<Box
							as="button"
							p={1}
							borderRadius="full"
							_hover={{ bg: hoverBg }}
							onClick={() => setCategoryFilter(null)}
						>
							<FiX size={16} color="#888" />
						</Box>
					</HStack>
				</Box>
			)}

			{/* Create Debate Input - Threads style */}
			{user && (
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="xl"
					p={4}
					mb={6}
					cursor="pointer"
					onClick={onOpen}
					_hover={{ bg: hoverBg }}
					transition="all 0.15s"
				>
					<Flex justify="space-between" align="center">
						<Text color={mutedText} fontSize="sm">
							Start a debate...
						</Text>
						<Box
							as="span"
							bg={textColor}
							color={cardBg}
							fontWeight="semibold"
							borderRadius="lg"
							px={4}
							py={1.5}
							fontSize="sm"
						>
							Post
						</Box>
					</Flex>
				</Box>
			)}

			{/* Loading state */}
			{isLoading && (
				<Flex justify="center" py={10}>
					<Spinner size="lg" />
				</Flex>
			)}

			{/* Empty state */}
			{!isLoading && displayedDebates.length === 0 && (
				<Flex justify="center" align="center" py={10}>
					<Text color={mutedText}>
						{categoryFilter 
							? `No debates in "${categoryFilter}" yet.` 
							: "No debates yet. Start one!"
						}
					</Text>
				</Flex>
			)}

			{/* Debates Feed */}
			{!isLoading && displayedDebates.length > 0 && (
				<VStack spacing={4} align="stretch">
					{displayedDebates.map((debate) => (
						<DebateCard key={debate._id} debate={debate} />
					))}
				</VStack>
			)}

			{/* Create Debate Modal */}
			<CreateDebateModal
				isOpen={isOpen}
				onClose={onClose}
				onDebateCreated={handleDebateCreated}
			/>
		</Box>
	);
};

export default HomePage;