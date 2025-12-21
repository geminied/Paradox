import { Avatar } from "@chakra-ui/avatar";
import { Box, Flex, Link, Text, VStack, HStack, Grid, GridItem, Badge } from "@chakra-ui/layout";
import { Button, Stat, StatGroup, StatHelpText, StatLabel, StatNumber, useColorModeValue } from "@chakra-ui/react";
import { useState } from "react";
import { useRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link as RouterLink } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";

// Static data for demonstration
const STATIC_STATS = {
	empathyScore: 78,
	debatesParticipated: 24,
	competitionsJoined: 5,
	commentsPosted: 156,
	reactionsReceived: 342,
	crossSideAppreciations: 45,
	sameSideSupports: 89,
	winRate: 65,
};

const STATIC_HISTORY = [
	{ id: 1, type: "debate", title: "Should AI replace human jobs?", stance: "Disagree", date: "Nov 28, 2025", empathyEarned: 12 },
	{ id: 2, type: "competition", title: "Climate Policy Cup", result: "2nd Place", date: "Nov 20, 2025", empathyEarned: 45 },
	{ id: 3, type: "debate", title: "Universal Basic Income", stance: "Agree", date: "Nov 15, 2025", empathyEarned: 8 },
	{ id: 4, type: "debate", title: "Remote Work Productivity", stance: "Agree", date: "Nov 10, 2025", empathyEarned: 15 },
];

const UserHeader = ({ user }) => {
	const [currentUser, setCurrentUser] = useRecoilState(userAtom);
	const showToast = useShowToast();
	const isOwnProfile = currentUser?._id === user._id;
	
	// Check if current user is following this user - derive from global state
	const isFollowing = currentUser?.following?.includes(user._id) || false;
	const [isUpdating, setIsUpdating] = useState(false);
	const [followersCount, setFollowersCount] = useState(user.followers?.length || 0);

	// Balanced color scheme: clean with subtle accent colors
	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const accentColor = useColorModeValue("purple.500", "purple.400");
	const accentBg = useColorModeValue("purple.50", "rgba(128, 90, 213, 0.12)");

	// Handle follow/unfollow
	const handleFollowUnfollow = async () => {
		if (!currentUser) {
			showToast("Error", "Please login to follow users", "error");
			return;
		}
		if (isUpdating) return;

		setIsUpdating(true);
		try {
			const res = await fetch(`/api/users/follow/${user._id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			// Update local followers count
			setFollowersCount((prev) => (data.isFollowing ? prev + 1 : prev - 1));
			
			// Update global state and localStorage
			const updatedFollowing = data.isFollowing
				? [...(currentUser.following || []), user._id]
				: (currentUser.following || []).filter(id => id !== user._id);
			
			const updatedUser = { ...currentUser, following: updatedFollowing };
			setCurrentUser(updatedUser);
			localStorage.setItem("user-paradox", JSON.stringify(updatedUser));
			
			showToast("Success", data.message, "success");
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsUpdating(false);
		}
	};

	const EmpathyScoreCard = () => (
		<Box
			borderRadius="2xl"
			p={6}
			bg={useColorModeValue("linear-gradient(135deg, #f7f7f8 0%, #fff 100%)", "linear-gradient(135deg, #1a1a1c 0%, #101010 100%)")}
			border="1px"
			borderColor={useColorModeValue("gray.200", "#333333")}
			position="relative"
			overflow="hidden"
		>
			<Flex justify="space-between" align="center">
				<VStack align="start" spacing={2}>
					<Text 
						fontSize="xs" 
						fontWeight="semibold" 
						color={mutedText}
						textTransform="uppercase" 
						letterSpacing="wider"
					>
						Empathy Score
					</Text>
					<HStack align="baseline" spacing={1}>
						<Text fontSize="5xl" fontWeight="bold" color={textColor} lineHeight={1}>
							{STATIC_STATS.empathyScore}
						</Text>
						<Text fontSize="lg" color={mutedText} fontWeight="normal">/100</Text>
					</HStack>
					<HStack spacing={2} mt={1}>
						<Box 
							px={2} 
							py={0.5} 
							bg={useColorModeValue("green.50", "rgba(72, 187, 120, 0.15)")} 
							borderRadius="full"
						>
							<Text fontSize="xs" color={useColorModeValue("green.600", "green.400")} fontWeight="medium">
								Top 15%
							</Text>
						</Box>
						<Text fontSize="sm" color={mutedText}>of all debaters</Text>
					</HStack>
				</VStack>
				
				{/* Circular progress with gray accent */}
				<Box position="relative" w="90px" h="90px">
					<svg width="90" height="90" viewBox="0 0 90 90">
						<circle
							cx="45"
							cy="45"
							r="38"
							fill="none"
							stroke={useColorModeValue("#e8e8e8", "#2a2a2a")}
							strokeWidth="7"
						/>
						<circle
							cx="45"
							cy="45"
							r="38"
							fill="none"
							stroke={useColorModeValue("#4a4a4a", "#a0a0a0")}
							strokeWidth="7"
							strokeLinecap="round"
							strokeDasharray={`${STATIC_STATS.empathyScore * 2.39} 239`}
							transform="rotate(-90 45 45)"
						/>
					</svg>
					<VStack
						position="absolute"
						top="50%"
						left="50%"
						transform="translate(-50%, -50%)"
						spacing={0}
					>
						<Text fontSize="xl" fontWeight="bold" color={textColor} lineHeight={1}>
							{STATIC_STATS.empathyScore}
						</Text>
						<Text fontSize="xs" color={mutedText}>points</Text>
					</VStack>
				</Box>
			</Flex>
		</Box>
	);

	const StatsGrid = () => (
		<Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={3}>
			<GridItem>
				<Box bg={cardBg} p={4} borderRadius="xl" border="1px" borderColor={borderColor} 
					_hover={{ borderColor: accentColor, transform: "translateY(-2px)" }} transition="all 0.2s">
					<Text fontSize="2xl" fontWeight="bold" color={textColor}>
						{STATIC_STATS.debatesParticipated}
					</Text>
					<Text fontSize="xs" color={mutedText}>Debates</Text>
				</Box>
			</GridItem>
			<GridItem>
				<Box bg={cardBg} p={4} borderRadius="xl" border="1px" borderColor={borderColor}
					_hover={{ borderColor: "orange.400", transform: "translateY(-2px)" }} transition="all 0.2s">
					<Text fontSize="2xl" fontWeight="bold" color={textColor}>
						{STATIC_STATS.competitionsJoined}
					</Text>
					<Text fontSize="xs" color={mutedText}>Competitions</Text>
				</Box>
			</GridItem>
			<GridItem>
				<Box bg={cardBg} p={4} borderRadius="xl" border="1px" borderColor={borderColor}
					_hover={{ borderColor: "green.400", transform: "translateY(-2px)" }} transition="all 0.2s">
					<Text fontSize="2xl" fontWeight="bold" color={textColor}>
						{STATIC_STATS.winRate}%
					</Text>
					<Text fontSize="xs" color={mutedText}>Win Rate</Text>
				</Box>
			</GridItem>
			<GridItem>
				<Box bg={cardBg} p={4} borderRadius="xl" border="1px" borderColor={borderColor}
					_hover={{ borderColor: "pink.400", transform: "translateY(-2px)" }} transition="all 0.2s">
					<Text fontSize="2xl" fontWeight="bold" color={textColor}>
						{STATIC_STATS.reactionsReceived}
					</Text>
					<Text fontSize="xs" color={mutedText}>Reactions</Text>
				</Box>
			</GridItem>
		</Grid>
	);

	const ActivityHistory = () => (
		<VStack spacing={0} align="stretch" divider={<Box borderBottom="1px" borderColor={borderColor} />}>
			{STATIC_HISTORY.map((item) => (
				<Box
					key={item.id}
					py={4}
					_hover={{ bg: useColorModeValue("gray.50", "#0a0a0a") }}
					transition="all 0.15s"
					cursor="pointer"
				>
					<Flex justify="space-between" align="center">
						<VStack align="start" spacing={1}>
							<Text fontWeight="medium" fontSize="sm" color={textColor}>
								{item.title}
							</Text>
							<HStack spacing={2}>
								<Badge 
									size="sm" 
									colorScheme={item.type === "competition" ? "orange" : "purple"}
									variant="subtle"
									fontSize="xs"
								>
									{item.type === "competition" ? item.result : item.stance}
								</Badge>
								<Text fontSize="xs" color={mutedText}>
									{item.date}
								</Text>
							</HStack>
						</VStack>
						<Text fontSize="sm" fontWeight="semibold" color={useColorModeValue("green.500", "green.400")}>
							+{item.empathyEarned} EP
						</Text>
					</Flex>
				</Box>
			))}
		</VStack>
	);

	return (
		<Box>
			{/* Profile Header */}
			<Flex align="center" mb={4} gap={6}>
				<Avatar
					size="xl"
					name={user.name}
					bg={accentColor}
					color="white"
					fontSize="2xl"
				/>
				<VStack align="start" spacing={1} flex={1}>
					<Text fontSize="2xl" fontWeight="bold" color={textColor}>
						{user.name}
					</Text>
					<Text color={mutedText}>@{user.username}</Text>
					<Text fontSize="sm" color={mutedText}>
						{user.bio || "No bio yet"}
					</Text>
				</VStack>
			</Flex>

			{/* Followers / Following Stats */}
			<HStack spacing={6} mb={4}>
				<HStack spacing={1}>
					<Text fontWeight="bold" color={textColor}>
						{followersCount}
					</Text>
					<Text color={mutedText} fontSize="sm">
						Followers
					</Text>
				</HStack>
				<HStack spacing={1}>
					<Text fontWeight="bold" color={textColor}>
						{user.following?.length || 0}
					</Text>
					<Text color={mutedText} fontSize="sm">
						Following
					</Text>
				</HStack>
			</HStack>

			{/* Edit Profile / Follow Button */}
			{isOwnProfile ? (
				<Link as={RouterLink} to='/update' _hover={{ textDecoration: "none" }}>
					<Button
						w="full"
						variant="outline"
						borderColor={borderColor}
						color={textColor}
						fontWeight="semibold"
						mb={8}
						_hover={{ bg: useColorModeValue("gray.50", "#1a1a1a") }}
					>
						Edit profile
					</Button>
				</Link>
			) : (
				<Button
					w="full"
					bg={isFollowing ? "transparent" : accentColor}
					color={isFollowing ? textColor : "white"}
					variant={isFollowing ? "outline" : "solid"}
					borderColor={isFollowing ? borderColor : accentColor}
					fontWeight="semibold"
					mb={8}
					isLoading={isUpdating}
					onClick={handleFollowUnfollow}
					_hover={{ 
						bg: isFollowing 
							? useColorModeValue("gray.50", "#1a1a1a") 
							: useColorModeValue("purple.600", "purple.500"),
						transform: "translateY(-1px)"
					}}
					transition="all 0.15s"
				>
					{isFollowing ? "Unfollow" : "Follow"}
				</Button>
			)}

			{/* Empathy Score Card */}
			<Box mb={8}>
				<EmpathyScoreCard />
			</Box>

			{/* Empathy Breakdown */}
			<Box mb={8} bg={cardBg} p={5} borderRadius="xl" border="1px" borderColor={borderColor}>
				<Text fontWeight="semibold" color={textColor} mb={4}>Empathy Breakdown</Text>
				<StatGroup>
					<Stat>
						<StatLabel color={mutedText} fontSize="xs">Cross-Side</StatLabel>
						<StatNumber color={textColor} fontSize="xl">{STATIC_STATS.crossSideAppreciations}</StatNumber>
						<StatHelpText color={mutedText} fontSize="xs">+3 EP each</StatHelpText>
					</Stat>
					<Stat>
						<StatLabel color={mutedText} fontSize="xs">Same-Side</StatLabel>
						<StatNumber color={textColor} fontSize="xl">{STATIC_STATS.sameSideSupports}</StatNumber>
						<StatHelpText color={mutedText} fontSize="xs">+1 EP each</StatHelpText>
					</Stat>
					<Stat>
						<StatLabel color={mutedText} fontSize="xs">Comments</StatLabel>
						<StatNumber color={textColor} fontSize="xl">{STATIC_STATS.commentsPosted}</StatNumber>
						<StatHelpText color={mutedText} fontSize="xs">Quality matters</StatHelpText>
					</Stat>
				</StatGroup>
			</Box>

			{/* Stats Overview */}
			<Box mb={8}>
				<Text fontWeight="semibold" color={textColor} mb={4}>Statistics</Text>
				<StatsGrid />
			</Box>

			{/* Recent Activity */}
			<Box mb={6}>
				<Flex mb={4} justify="space-between" align="center">
					<Text fontWeight="semibold" color={textColor}>Recent Activity</Text>
					<Badge colorScheme="gray" variant="subtle" fontSize="xs">Last 30 days</Badge>
				</Flex>
				<Box border="1px" borderColor={borderColor} borderRadius="xl" overflow="hidden" px={4}>
					<ActivityHistory />
				</Box>
			</Box>
		</Box>
	);
};

export default UserHeader;