import {
	Box,
	VStack,
	Text,
	HStack,
	Flex,
	Spinner,
	Badge,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiTrendingUp, FiCompass } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const Sidebar = ({ onCategoryFilter, activeCategory }) => {
	const showToast = useShowToast();

	const [hotTopics, setHotTopics] = useState([]);
	const [suggested, setSuggested] = useState([]);
	const [isLoadingHot, setIsLoadingHot] = useState(true);
	const [isLoadingSuggested, setIsLoadingSuggested] = useState(true);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const hoverBg = useColorModeValue("gray.50", "#1a1a1a");
	const activeBg = useColorModeValue("gray.100", "#252525");

	// Fetch hot topics
	useEffect(() => {
		const fetchHotTopics = async () => {
			try {
				const res = await fetch("/api/debates/hot");
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				setHotTopics(data);
			} catch (error) {
				console.error("Error fetching hot topics:", error);
			} finally {
				setIsLoadingHot(false);
			}
		};

		fetchHotTopics();
	}, []);

	// Fetch suggested debates
	useEffect(() => {
		const fetchSuggested = async () => {
			try {
				const res = await fetch("/api/debates/suggested");
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				setSuggested(data);
			} catch (error) {
				console.error("Error fetching suggested:", error);
			} finally {
				setIsLoadingSuggested(false);
			}
		};

		fetchSuggested();
	}, []);

	const handleCategoryClick = (category) => {
		if (activeCategory === category) {
			onCategoryFilter(null); // Clear filter
		} else {
			onCategoryFilter(category);
		}
	};

	return (
		<Box w="240px" flexShrink={0}>
			<VStack spacing={4} align="stretch">
				{/* Hot Topics Section */}
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="xl"
					overflow="hidden"
				>
					<HStack spacing={2} p={4} borderBottom="1px" borderColor={borderColor}>
						<FiTrendingUp color="#F56565" />
						<Text fontWeight="semibold" fontSize="sm" color={textColor}>
							Hot Topics
						</Text>
					</HStack>

					{isLoadingHot ? (
						<Flex justify="center" py={6}>
							<Spinner size="sm" />
						</Flex>
					) : hotTopics.length === 0 ? (
						<Box p={4}>
							<Text fontSize="xs" color={mutedText}>
								No hot topics yet
							</Text>
						</Box>
					) : (
						<VStack spacing={0} align="stretch">
							{hotTopics.map((topic, index) => (
								<Box
									key={topic._id}
									px={4}
									py={3}
									cursor="pointer"
									bg={activeCategory === topic.category ? activeBg : "transparent"}
									_hover={{ bg: hoverBg }}
									transition="all 0.15s"
									onClick={() => handleCategoryClick(topic.category)}
									borderBottom={index < hotTopics.length - 1 ? "1px" : "none"}
									borderColor={borderColor}
								>
									<HStack spacing={3} align="flex-start">
										<Text
											fontWeight="bold"
											fontSize="sm"
											color={mutedText}
											minW="16px"
										>
											{index + 1}
										</Text>
										<Box flex={1}>
											<Text
												fontSize="sm"
												fontWeight="medium"
												color={textColor}
												noOfLines={2}
												lineHeight="1.4"
											>
												{topic.title}
											</Text>
											<HStack spacing={2} mt={1}>
												<Badge
													colorScheme="purple"
													variant="subtle"
													fontSize="9px"
													borderRadius="full"
													px={2}
												>
													{topic.category}
												</Badge>
												<Text fontSize="xs" color={mutedText}>
													{topic.upvotes?.length || 0} upvotes · {topic.commentsCount || 0} comments
												</Text>
											</HStack>
										</Box>
									</HStack>
								</Box>
							))}
						</VStack>
					)}
				</Box>

				{/* Suggested For You Section */}
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="xl"
					overflow="hidden"
				>
					<HStack spacing={2} p={4} borderBottom="1px" borderColor={borderColor}>
						<FiCompass color="#805AD5" />
						<Text fontWeight="semibold" fontSize="sm" color={textColor}>
							Suggested For You
						</Text>
					</HStack>

					{isLoadingSuggested ? (
						<Flex justify="center" py={6}>
							<Spinner size="sm" />
						</Flex>
					) : suggested.length === 0 ? (
						<Box p={4}>
							<Text fontSize="xs" color={mutedText}>
								No suggestions yet
							</Text>
						</Box>
					) : (
						<VStack spacing={0} align="stretch">
							{suggested.map((debate, index) => (
								<Box
									key={debate._id}
									px={4}
									py={3}
									cursor="pointer"
									bg={activeCategory === debate.category ? activeBg : "transparent"}
									_hover={{ bg: hoverBg }}
									transition="all 0.15s"
									onClick={() => handleCategoryClick(debate.category)}
									borderBottom={index < suggested.length - 1 ? "1px" : "none"}
									borderColor={borderColor}
								>
									<Text
										fontSize="sm"
										fontWeight="medium"
										color={textColor}
										noOfLines={2}
										lineHeight="1.4"
									>
										{debate.title}
									</Text>
									<HStack spacing={2} mt={1}>
										<Badge
											colorScheme="blue"
											variant="subtle"
											fontSize="9px"
											borderRadius="full"
											px={2}
										>
											{debate.category}
										</Badge>
										<Text fontSize="xs" color={mutedText}>
											by @{debate.author?.username}
										</Text>
									</HStack>
								</Box>
							))}
						</VStack>
					)}
				</Box>

				{/* Active Filter Indicator */}
				{activeCategory && (
					<Box
						bg={cardBg}
						border="1px"
						borderColor="purple.500"
						borderRadius="xl"
						p={3}
					>
						<HStack justify="space-between">
							<Text fontSize="xs" color={mutedText}>
								Filtering by:
							</Text>
							<Badge colorScheme="purple" borderRadius="full" px={2}>
								{activeCategory}
							</Badge>
						</HStack>
						<Text
							fontSize="xs"
							color="purple.400"
							mt={2}
							cursor="pointer"
							_hover={{ textDecoration: "underline" }}
							onClick={() => onCategoryFilter(null)}
						>
							Clear filter
						</Text>
					</Box>
				)}
			</VStack>
		</Box>
	);
};

export default Sidebar;