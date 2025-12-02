import {
	Box,
	Flex,
	Text,
	HStack,
	VStack,
	Avatar,
	Badge,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { formatDistanceToNowStrict } from "date-fns";
import useShowToast from "../hooks/useShowToast";

const ThreadedCommentCard = ({ comment, onReply, onUpdate, debateTitle, depth = 0, isLastChild = false }) => {
	const currentUser = useRecoilValue(userAtom);
	const showToast = useShowToast();

	const [samePointReactions, setSamePointReactions] = useState(
		comment.samePointReactions || []
	);
	const [goodPointReactions, setGoodPointReactions] = useState(
		comment.goodPointReactions || []
	);
	const [isReacting, setIsReacting] = useState(false);

	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const threadLineColor = useColorModeValue("gray.300", "#444444");

	const isOwnComment = currentUser && comment.author?._id === currentUser._id;
	const hasSamePoint = currentUser && samePointReactions.includes(currentUser._id);
	const hasGoodPoint = currentUser && goodPointReactions.includes(currentUser._id);
	const hasReplies = comment.replies && comment.replies.length > 0;
	const isReply = depth > 0;

	const timeAgo = formatDistanceToNowStrict(new Date(comment.createdAt), {
		addSuffix: false,
	});

	const handleSamePoint = async () => {
		if (!currentUser) {
			showToast("Error", "Please login to react", "error");
			return;
		}
		if (isOwnComment) {
			showToast("Error", "You can't react to your own comment", "error");
			return;
		}
		if (isReacting) return;

		setIsReacting(true);
		try {
			const res = await fetch(`/api/comments/${comment._id}/same-point`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			setSamePointReactions(data.samePointReactions);
			setGoodPointReactions(data.goodPointReactions);
			onUpdate?.({ ...comment, ...data });
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsReacting(false);
		}
	};

	const handleGoodPoint = async () => {
		if (!currentUser) {
			showToast("Error", "Please login to react", "error");
			return;
		}
		if (isOwnComment) {
			showToast("Error", "You can't react to your own comment", "error");
			return;
		}
		if (isReacting) return;

		setIsReacting(true);
		try {
			const res = await fetch(`/api/comments/${comment._id}/good-point`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			setSamePointReactions(data.samePointReactions);
			setGoodPointReactions(data.goodPointReactions);
			onUpdate?.({ ...comment, ...data });
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsReacting(false);
		}
	};

	return (
		<Box position="relative">
			<Flex>
				{/* Left side: Avatar + Thread line */}
				<Flex direction="column" align="center" mr={3} position="relative">
					<Avatar size="sm" name={comment.author?.name} />
					{/* Thread line extending down to replies */}
					{hasReplies && (
						<Box
							position="absolute"
							top="36px"
							left="50%"
							transform="translateX(-50%)"
							w="2px"
							bottom="-8px"
							bg={threadLineColor}
						/>
					)}
				</Flex>

				{/* Right side: Content */}
				<Box flex={1} pb={4}>
					{/* Author row */}
					<Flex align="center" gap={2} mb={1} flexWrap="wrap">
						<Text fontWeight="semibold" fontSize="sm" color={textColor}>
							{comment.author?.name}
						</Text>
						<Text fontSize="xs" color={mutedText}>
							@{comment.author?.username}
						</Text>
						<Text fontSize="xs" color={mutedText}>·</Text>
						<Text fontSize="xs" color={mutedText}>
							{timeAgo}
						</Text>
						{/* Stance badge - different style for replies */}
						{isReply ? (
							<Badge
								colorScheme={comment.stance === "agree" ? "green" : "red"}
								variant="outline"
								fontSize="9px"
								borderRadius="full"
								px={2}
							>
								{comment.stance === "agree" ? "↑ agrees" : "↓ disagrees"}
							</Badge>
						) : (
							<Badge
								colorScheme={comment.stance === "agree" ? "green" : "red"}
								variant="subtle"
								fontSize="10px"
								borderRadius="full"
								px={2}
								textTransform="uppercase"
							>
								{comment.stance}
							</Badge>
						)}
					</Flex>

					{/* Comment text */}
					<Text fontSize="sm" color={textColor} mb={3}>
						{comment.text}
					</Text>

					{/* Actions row */}
					<HStack spacing={4}>
						{/* Same point button - anyone can use */}
						{!isOwnComment && (
							<Text
								fontSize="xs"
								color={hasSamePoint ? "blue.500" : mutedText}
								cursor="pointer"
								_hover={{ color: "blue.500" }}
								onClick={handleSamePoint}
								opacity={isReacting ? 0.5 : 1}
							>
								Same point{samePointReactions.length > 0 && ` (${samePointReactions.length})`}
							</Text>
						)}

						{/* Good point button - anyone can use */}
						{!isOwnComment && (
							<Text
								fontSize="xs"
								color={hasGoodPoint ? "purple.500" : mutedText}
								cursor="pointer"
								_hover={{ color: "purple.500" }}
								onClick={handleGoodPoint}
								opacity={isReacting ? 0.5 : 1}
							>
								Good point{goodPointReactions.length > 0 && ` (${goodPointReactions.length})`}
							</Text>
						)}

						{/* Reply button */}
						<Text
							fontSize="xs"
							color={mutedText}
							cursor="pointer"
							_hover={{ color: textColor }}
							onClick={() => onReply?.(comment)}
						>
							Reply
						</Text>

						{/* Show reaction counts for own comments */}
						{isOwnComment && (
							<>
								{samePointReactions.length > 0 && (
									<Text fontSize="xs" color={mutedText}>
										{samePointReactions.length} same point
									</Text>
								)}
								{goodPointReactions.length > 0 && (
									<Text fontSize="xs" color={mutedText}>
										{goodPointReactions.length} good point
									</Text>
								)}
							</>
						)}
					</HStack>
				</Box>
			</Flex>

			{/* Nested replies */}
			{hasReplies && (
				<Box pl="20px" position="relative">
					{/* Continuous thread line on the left */}
					<Box
						position="absolute"
						left="15px"
						top="0"
						w="2px"
						bg={threadLineColor}
						style={{ height: "calc(100% - 20px)" }}
					/>
					<VStack spacing={0} align="stretch" pl={4}>
						{comment.replies.map((reply, index) => (
							<Box key={reply._id} position="relative">
								{/* Horizontal connector line */}
								<Box
									position="absolute"
									left="-20px"
									top="16px"
									w="20px"
									h="2px"
									bg={threadLineColor}
								/>
								<ThreadedCommentCard
									comment={reply}
									onReply={onReply}
									onUpdate={onUpdate}
									debateTitle={debateTitle}
									depth={depth + 1}
									isLastChild={index === comment.replies.length - 1}
								/>
							</Box>
						))}
					</VStack>
				</Box>
			)}
		</Box>
	);
};

export default ThreadedCommentCard;