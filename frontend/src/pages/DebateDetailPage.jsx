import {
	Box,
	Flex,
	Text,
	VStack,
	HStack,
	Avatar,
	Badge,
	Spinner,
	useColorModeValue,
	useDisclosure,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { FiArrowLeft, FiArrowUp, FiMessageCircle, FiBookmark } from "react-icons/fi";
import { formatDistanceToNowStrict } from "date-fns";
import useShowToast from "../hooks/useShowToast";
import ThreadedCommentCard from "../components/ThreadedCommentCard";
import AddCommentModal from "../components/AddCommentModal";

const DebateDetailPage = () => {
	const { debateId } = useParams();
	const navigate = useNavigate();
	const [currentUser, setCurrentUser] = useRecoilState(userAtom);
	const showToast = useShowToast();
	const { isOpen, onOpen, onClose } = useDisclosure();

	const [debate, setDebate] = useState(null);
	const [comments, setComments] = useState([]);
	const [stats, setStats] = useState({ total: 0, agreeCount: 0, disagreeCount: 0 });
	const [isLoading, setIsLoading] = useState(true);
	const [replyingTo, setReplyingTo] = useState(null);
	const [upvotes, setUpvotes] = useState([]);
	const [isUpvoting, setIsUpvoting] = useState(false);
	const [isBookmarked, setIsBookmarked] = useState(false);
	const [isBookmarking, setIsBookmarking] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const hoverBg = useColorModeValue("gray.50", "#1a1a1a");

	// Check if debate is bookmarked
	useEffect(() => {
		if (currentUser?.bookmarks && debateId) {
			setIsBookmarked(currentUser.bookmarks.includes(debateId));
		}
	}, [currentUser?.bookmarks, debateId]);

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				// Fetch debate
				const debateRes = await fetch(`/api/debates/${debateId}`);
				const debateData = await debateRes.json();
				if (!debateRes.ok) throw new Error(debateData.error);
				setDebate(debateData);
				setUpvotes(debateData.upvotes || []);

				// Fetch comments
				const commentsRes = await fetch(`/api/comments/${debateId}`);
				const commentsData = await commentsRes.json();
				if (!commentsRes.ok) throw new Error(commentsData.error);
				setComments(commentsData.comments || []);
				setStats(commentsData.stats || { total: 0, agreeCount: 0, disagreeCount: 0 });
			} catch (error) {
				showToast("Error", error.message, "error");
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [debateId, showToast]);

	const handleUpvote = async () => {
		if (!currentUser) {
			showToast("Error", "Please login to upvote", "error");
			return;
		}
		if (isUpvoting) return;

		setIsUpvoting(true);
		try {
			const res = await fetch(`/api/debates/${debateId}/upvote`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
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

	const handleBookmark = async () => {
		if (!currentUser) {
			showToast("Error", "Please login to bookmark debates", "error");
			return;
		}
		if (isBookmarking) return;

		setIsBookmarking(true);
		try {
			const res = await fetch(`/api/users/bookmark/${debateId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			// Update local state
			setIsBookmarked(data.isBookmarked);

			// Update user atom with new bookmarks list
			const updatedBookmarks = data.isBookmarked
				? [...(currentUser.bookmarks || []), debateId]
				: (currentUser.bookmarks || []).filter(id => id !== debateId);
			
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

	const handleReply = (comment) => {
		setReplyingTo(comment);
		onOpen();
	};

	const handleNewComment = () => {
		setReplyingTo(null);
		onOpen();
	};

	const handleCommentCreated = (newComment) => {
		if (replyingTo) {
			// Add reply to the parent comment
			const addReplyToComment = (comments) => {
				return comments.map((c) => {
					if (c._id === replyingTo._id) {
						return {
							...c,
							replies: [...(c.replies || []), newComment],
							repliesCount: (c.repliesCount || 0) + 1,
						};
					}
					if (c.replies && c.replies.length > 0) {
						return {
							...c,
							replies: addReplyToComment(c.replies),
						};
					}
					return c;
				});
			};
			setComments(addReplyToComment(comments));
		} else {
			// Add as new root comment
			setComments([newComment, ...comments]);
		}
		// Update stats
		setStats((prev) => ({
			total: prev.total + 1,
			agreeCount: prev.agreeCount + (newComment.stance === "agree" ? 1 : 0),
			disagreeCount: prev.disagreeCount + (newComment.stance === "disagree" ? 1 : 0),
		}));
	};

	if (isLoading) {
		return (
			<Flex justify="center" py={10} pt={6}>
				<Spinner size="lg" />
			</Flex>
		);
	}

	if (!debate) {
		return (
			<Box textAlign="center" py={10} pt={6}>
				<Text color={mutedText}>Debate not found</Text>
			</Box>
		);
	}

	const timeAgo = formatDistanceToNowStrict(new Date(debate.createdAt), {
		addSuffix: false,
	});
	const hasUpvoted = currentUser && upvotes.includes(currentUser._id);
	// Calculate percentage based on root comments only (agreeCount + disagreeCount)
	const rootCommentsTotal = stats.agreeCount + stats.disagreeCount;
	const agreePercent = rootCommentsTotal > 0 ? Math.round((stats.agreeCount / rootCommentsTotal) * 100) : 50;
	const disagreePercent = 100 - agreePercent;

	return (
		<Box pt={6} pb={8}>
			{/* Back button */}
			<HStack
				mb={4}
				cursor="pointer"
				onClick={() => navigate("/")}
				_hover={{ color: textColor }}
				color={mutedText}
			>
				<FiArrowLeft size={18} />
				<Text fontSize="sm">Back to debates</Text>
			</HStack>

			{/* Debate Header Card */}
			<Box
				bg={cardBg}
				border="1px"
				borderColor={borderColor}
				borderRadius="3xl"
				p={5}
				mb={4}
			>
				{/* Author info */}
				<HStack spacing={3} mb={3}>
					<Avatar size="sm" name={debate.author?.name} />
					<Flex align="center" gap={2} flexWrap="wrap">
						<Text fontWeight="semibold" fontSize="sm" color={textColor}>
							{debate.author?.name}
						</Text>
						<Text fontSize="xs" color={mutedText}>
							@{debate.author?.username}
						</Text>
						<Text fontSize="xs" color={mutedText}>·</Text>
						<Text fontSize="xs" color={mutedText}>
							{timeAgo}
						</Text>
					</Flex>
				</HStack>

				{/* Category */}
				{debate.category && (
					<Badge
						colorScheme="purple"
						variant="subtle"
						fontSize="xs"
						mb={3}
						borderRadius="full"
						px={2}
					>
						{debate.category}
					</Badge>
				)}

				{/* Title */}
				<Text fontWeight="bold" fontSize="lg" color={textColor} mb={2}>
					{debate.title}
				</Text>

				{/* Context */}
				{debate.context && (
					<Text fontSize="sm" color={mutedText} mb={4}>
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
					<HStack spacing={1} color={mutedText}>
						<FiMessageCircle size={18} />
						<Text fontSize="sm">{stats.total}</Text>
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

			{/* Stance Summary Bar - only show if there are root comments */}
			{rootCommentsTotal > 0 && (
				<Box mb={4}>
					<Flex align="center" mb={2}>
						<Text fontSize="xs" color="green.500" fontWeight="semibold">
							AGREE {agreePercent}%
						</Text>
						<Box flex={1} mx={3}>
							<Flex h="6px" borderRadius="full" overflow="hidden" bg={borderColor}>
								<Box
									w={`${agreePercent}%`}
									bg="green.500"
									transition="width 0.3s"
								/>
								<Box
									w={`${disagreePercent}%`}
									bg="red.500"
									transition="width 0.3s"
								/>
							</Flex>
						</Box>
						<Text fontSize="xs" color="red.500" fontWeight="semibold">
							{disagreePercent}% DISAGREE
						</Text>
					</Flex>
					<Text fontSize="xs" color={mutedText} textAlign="center">
						{stats.agreeCount} agree · {stats.disagreeCount} disagree
					</Text>
				</Box>
			)}

			{/* Reply Input - Threads style */}
			{currentUser && (
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="3xl"
					p={4}
					mb={6}
					cursor="pointer"
					onClick={handleNewComment}
					_hover={{ bg: hoverBg }}
					transition="all 0.15s"
				>
					<Flex align="center" gap={3}>
						<Avatar size="sm" name={currentUser?.name} />
						<Text color={mutedText} fontSize="sm" flex={1}>
							Reply to this debate...
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

			{/* Comments Feed */}
			{comments.length === 0 ? (
				<Box textAlign="center" py={8}>
					<Text color={mutedText} fontSize="sm">
						No comments yet. Be the first to share your argument!
					</Text>
				</Box>
			) : (
				<VStack spacing={0} align="stretch">
					{comments.map((comment) => (
						<ThreadedCommentCard
							key={comment._id}
							comment={comment}
							debateTitle={debate?.title || "this debate"}
							onReply={handleReply}
						/>
					))}
				</VStack>
			)}

			{/* Add Comment Modal */}
			<AddCommentModal
				isOpen={isOpen}
				onClose={onClose}
				debateId={debateId}
				debateTitle={debate?.title || "this debate"}
				parentComment={replyingTo}
				onCommentCreated={handleCommentCreated}
			/>
		</Box>
	);
};

export default DebateDetailPage;