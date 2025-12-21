import {
	Box,
	Flex,
	Text,
	VStack,
	HStack,
	Avatar,
	Badge,
	Button,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { FiMessageCircle, FiArrowUp, FiBookmark } from "react-icons/fi";
import { formatDistanceToNowStrict } from "date-fns";
import useShowToast from "../hooks/useShowToast";

const DebateCard = ({ debate, onUpdate, isFromFollowingFeed = false }) => {
	const navigate = useNavigate();
	const [currentUser, setCurrentUser] = useRecoilState(userAtom);
	const showToast = useShowToast();
	
	const [upvotes, setUpvotes] = useState(debate.upvotes || []);
	const [isUpvoting, setIsUpvoting] = useState(false);
	const [isFollowLoading, setIsFollowLoading] = useState(false);
	const [isBookmarked, setIsBookmarked] = useState(false);
	const [isBookmarking, setIsBookmarking] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const hoverBg = useColorModeValue("gray.50", "#1a1a1a");

	const hasUpvoted = currentUser && upvotes.includes(currentUser._id);
	const timeAgo = formatDistanceToNowStrict(new Date(debate.createdAt), { addSuffix: false });
	const isOwnPost = currentUser?._id === debate.author?._id;

	// Determine if following: use isFromFollowingFeed prop OR check currentUser.following array
	const isFollowing = isFromFollowingFeed || (currentUser?.following?.includes(debate.author?._id) ?? false);

	// Check if debate is bookmarked
	useEffect(() => {
		if (currentUser?.bookmarks) {
			setIsBookmarked(currentUser.bookmarks.includes(debate._id));
		}
	}, [currentUser?.bookmarks, debate._id]);

	const handleCardClick = () => {
		navigate(`/debate/${debate._id}`);
	};

	const handleBookmark = async (e) => {
		e.stopPropagation();
		
		if (!currentUser) {
			showToast("Error", "Please login to bookmark debates", "error");
			return;
		}

		if (isBookmarking) return;

		setIsBookmarking(true);
		try {
			const res = await fetch(`/api/users/bookmark/${debate._id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			// Update local state
			setIsBookmarked(data.isBookmarked);

			// Update user atom with new bookmarks list
			const updatedBookmarks = data.isBookmarked
				? [...(currentUser.bookmarks || []), debate._id]
				: (currentUser.bookmarks || []).filter(id => id !== debate._id);
			
			const updatedUser = { ...currentUser, bookmarks: updatedBookmarks };
			setCurrentUser(updatedUser);
			localStorage.setItem("user-paradox", JSON.stringify(updatedUser));
			
			showToast("Success", data.message, "success");
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsBookmarking(false);
		}
	};

	const handleFollow = async (e) => {
		e.stopPropagation();
		
		if (!currentUser) {
			showToast("Error", "Please login to follow users", "error");
			return;
		}

		if (isFollowLoading) return;

		setIsFollowLoading(true);
		try {
			const res = await fetch(`/api/users/follow/${debate.author._id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			// Update the user atom with new following list
			const updatedFollowing = data.isFollowing
				? [...(currentUser.following || []), debate.author._id]
				: (currentUser.following || []).filter(id => id !== debate.author._id);
			
			const updatedUser = { ...currentUser, following: updatedFollowing };
			setCurrentUser(updatedUser);
			localStorage.setItem("user-paradox", JSON.stringify(updatedUser));
			
			showToast("Success", data.message, "success");
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsFollowLoading(false);
		}
	};

	const handleUpvote = async (e) => {
		e.stopPropagation();
		
		if (!currentUser) {
			showToast("Error", "Please login to upvote", "error");
			return;
		}

		if (isUpvoting) return;

		setIsUpvoting(true);
		try {
			const res = await fetch(`/api/debates/${debate._id}/upvote`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			setUpvotes(data.upvotes);
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsUpvoting(false);
		}
	};

	return (
		<Box
			bg={cardBg}
			border="1px"
			borderColor={borderColor}
			borderRadius="3xl"
			p={4}
			_hover={{ bg: hoverBg }}
			transition="all 0.15s"
			cursor="pointer"
			onClick={handleCardClick}
		>
			{/* Author info */}
			<HStack spacing={3} mb={3} justify="space-between">
				<HStack spacing={3}>
					<Avatar size="sm" name={debate.author?.name} />
					<Flex align="center" gap={2} flexWrap="wrap">
						<Text fontWeight="semibold" fontSize="sm" color={textColor}>
							{debate.author?.name}
						</Text>
						<Text fontSize="xs" color={mutedText}>
							{timeAgo}
						</Text>
					</Flex>
				</HStack>
				{!isOwnPost && currentUser && (
					<Button
						size="xs"
						variant={isFollowing ? "outline" : "solid"}
						colorScheme="purple"
						isLoading={isFollowLoading}
						onClick={handleFollow}
						borderRadius="full"
						px={3}
						fontWeight="medium"
						_hover={isFollowing ? { bg: "red.500", borderColor: "red.500", color: "white" } : {}}
					>
						{isFollowing ? "Following" : "Follow"}
					</Button>
				)}
			</HStack>

			{/* Category badge */}
			{debate.category && (
				<Badge
					colorScheme="purple"
					variant="subtle"
					fontSize="xs"
					mb={2}
					borderRadius="full"
					px={2}
				>
					{debate.category}
				</Badge>
			)}

			{/* Title */}
			<Text fontWeight="bold" fontSize="md" color={textColor} mb={2}>
				{debate.title}
			</Text>

			{/* Context */}
			{debate.context && (
				<Text fontSize="sm" color={mutedText} mb={4} noOfLines={3}>
					{debate.context}
				</Text>
			)}

			{/* Action buttons */}
			<HStack spacing={6} pt={2}>
				<HStack
					spacing={1}
					color={hasUpvoted ? "green.500" : mutedText}
					_hover={{ color: "green.500" }}
					cursor="pointer"
					onClick={handleUpvote}
					opacity={isUpvoting ? 0.5 : 1}
				>
					<FiArrowUp size={18} />
					<Text fontSize="sm">{upvotes.length}</Text>
				</HStack>
				<HStack
					spacing={1}
					color={mutedText}
					_hover={{ color: "blue.500" }}
					cursor="pointer"
				>
					<FiMessageCircle size={18} />
					<Text fontSize="sm">{debate.commentsCount || 0}</Text>
				</HStack>
				<Box flex={1} />
				<Box
					color={isBookmarked ? "yellow.500" : mutedText}
					_hover={{ color: "yellow.500" }}
					cursor="pointer"
					onClick={handleBookmark}
					opacity={isBookmarking ? 0.5 : 1}
				>
					<FiBookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
				</Box>
			</HStack>
		</Box>
	);
};

export default DebateCard;