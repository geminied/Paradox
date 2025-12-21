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
import { FiX, FiTrendingUp } from "react-icons/fi";

const HomePage = ({ categoryFilter, setCategoryFilter, activeTab }) => {
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();
	const { isOpen, onOpen, onClose } = useDisclosure();
	
	const [debates, setDebates] = useState([]);
	const [followingDebates, setFollowingDebates] = useState([]);
	const [filteredDebates, setFilteredDebates] = useState([]);
	const [trendingTopics, setTrendingTopics] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
	const [selectedTrending, setSelectedTrending] = useState(null);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const hoverBg = useColorModeValue("gray.50", "#1a1a1a");
	const pillBg = useColorModeValue("gray.100", "rgba(255,255,255,0.06)");
	const pillHoverBg = useColorModeValue("gray.200", "rgba(255,255,255,0.1)");
	const pillActiveBg = useColorModeValue("purple.100", "rgba(128,90,213,0.2)");

	// Fetch all debates on mount
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

	// Fetch trending topics
	useEffect(() => {
		const fetchTrending = async () => {
			try {
				const res = await fetch("/api/debates/hot");
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				// Get unique categories from hot debates
				const categories = [...new Set(data.map(d => d.category).filter(Boolean))];
				setTrendingTopics(categories.slice(0, 5));
			} catch (error) {
				console.error("Error fetching trending:", error);
			}
		};

		fetchTrending();
	}, []);

	// Fetch following feed when user switches to Following tab
	useEffect(() => {
		const fetchFollowingFeed = async () => {
			if (!user || activeTab !== 1) return;
			
			setIsLoadingFollowing(true);
			try {
				const res = await fetch("/api/users/following-feed");
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				setFollowingDebates(data);
			} catch (error) {
				showToast("Error", error.message, "error");
			} finally {
				setIsLoadingFollowing(false);
			}
		};

		fetchFollowingFeed();
	}, [activeTab, user, showToast]);

	// Filter debates when categoryFilter or selectedTrending changes
	useEffect(() => {
		const filterCategory = selectedTrending || categoryFilter;
		if (filterCategory) {
			const filtered = debates.filter(
				(d) => d.category?.toLowerCase() === filterCategory.toLowerCase()
			);
			setFilteredDebates(filtered);
		} else {
			setFilteredDebates(debates);
		}
	}, [categoryFilter, selectedTrending, debates]);

	const handleTrendingClick = (category) => {
		if (selectedTrending === category) {
			setSelectedTrending(null);
		} else {
			setSelectedTrending(category);
		}
	};

	const handleDebateCreated = (newDebate) => {
		setDebates([newDebate, ...debates]);
	};

	// Use filtered debates when any filter is active
	const displayedDebates = (categoryFilter || selectedTrending) ? filteredDebates : debates;

	// Render debate feed content
	const renderFeed = (debatesList, loading, emptyMessage, isFollowingFeed = false) => (
		<>
			{loading && (
				<Flex justify="center" py={10}>
					<Spinner size="lg" />
				</Flex>
			)}

			{!loading && debatesList.length === 0 && (
				<Flex justify="center" align="center" py={10}>
					<Text color={mutedText}>{emptyMessage}</Text>
				</Flex>
			)}

			{!loading && debatesList.length > 0 && (
				<VStack spacing={4} align="stretch">
					{debatesList.map((debate) => (
						<DebateCard key={debate._id} debate={debate} isFromFollowingFeed={isFollowingFeed} />
					))}
				</VStack>
			)}
		</>
	);

	return (
		<Box pt={4}>
			{/* Trending Topics Pills */}
			{trendingTopics.length > 0 && activeTab === 0 && (
				<Flex 
					gap={2} 
					mb={4} 
					flexWrap="wrap"
					align="center"
				>
					<HStack spacing={1} color={mutedText} mr={1}>
						<FiTrendingUp size={14} />
						<Text fontSize="xs" fontWeight="medium">Trending:</Text>
					</HStack>
					{trendingTopics.map((topic) => (
						<Box
							key={topic}
							as="button"
							px={3}
							py={1}
							fontSize="xs"
							fontWeight="medium"
							color={selectedTrending === topic ? "purple.400" : mutedText}
							bg={selectedTrending === topic ? pillActiveBg : pillBg}
							borderRadius="full"
							transition="all 0.15s"
							_hover={{ bg: pillHoverBg, color: textColor }}
							onClick={() => handleTrendingClick(topic)}
						>
							{topic}
						</Box>
					))}
					{selectedTrending && (
						<Box
							as="button"
							px={2}
							py={1}
							fontSize="xs"
							color={mutedText}
							_hover={{ color: textColor }}
							onClick={() => setSelectedTrending(null)}
						>
							<FiX size={14} />
						</Box>
					)}
				</Flex>
			)}

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
					borderRadius="3xl"
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
							borderRadius="3xl"
							px={4}
							py={1.5}
							fontSize="sm"
						>
							Post
						</Box>
					</Flex>
				</Box>
			)}

			{/* Feed Content - Based on active tab from header */}
			{user ? (
				<>
					{activeTab === 0 && renderFeed(
						displayedDebates, 
						isLoading, 
						(categoryFilter || selectedTrending)
							? `No debates in "${selectedTrending || categoryFilter}" yet.` 
							: "No debates yet. Start one!",
						false
					)}
					{activeTab === 1 && renderFeed(
						followingDebates, 
						isLoadingFollowing, 
						"No debates from people you follow yet. Start following users to see their debates here!",
						true
					)}
				</>
			) : (
				// Non-logged in users see regular feed
				<>
					{renderFeed(
						displayedDebates, 
						isLoading, 
						categoryFilter 
							? `No debates in "${categoryFilter}" yet.` 
							: "No debates yet. Start one!"
					)}
				</>
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