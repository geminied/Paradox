import {
	Box,
	Flex,
	Text,
	HStack,
	Avatar,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { formatDistanceToNowStrict } from "date-fns";
import useShowToast from "../hooks/useShowToast";

const CommentCard = ({ comment, currentUserStance, onUpdate }) => {
	const currentUser = useRecoilValue(userAtom);
	const showToast = useShowToast();

	const [samePointReactions, setSamePointReactions] = useState(
		comment.samePointReactions || []
	);
	const [goodPointReactions, setGoodPointReactions] = useState(
		comment.goodPointReactions || []
	);
	const [isReacting, setIsReacting] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	const isOwnComment = currentUser && comment.author._id === currentUser._id;
	const isSameStance = currentUserStance === comment.stance;

	const hasSamePoint = currentUser && samePointReactions.includes(currentUser._id);
	const hasGoodPoint = currentUser && goodPointReactions.includes(currentUser._id);

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
		<Box
			bg={cardBg}
			border="1px"
			borderColor={borderColor}
			borderRadius="3xl"
			p={3}
		>
			{/* Author info */}
			<HStack spacing={2} mb={2}>
				<Avatar size="xs" name={comment.author?.name} />
				<Text fontWeight="semibold" fontSize="xs" color={textColor}>
					{comment.author?.name}
				</Text>
				<Text fontSize="xs" color={mutedText}>
					· {timeAgo}
				</Text>
			</HStack>

			{/* Comment text */}
			<Text fontSize="sm" color={textColor} mb={3}>
				{comment.text}
			</Text>

			{/* Reaction buttons */}
			<HStack spacing={4}>
				{/* Same Point - only for same stance */}
				{isSameStance && !isOwnComment && (
					<HStack
						spacing={1}
						color={hasSamePoint ? "blue.500" : mutedText}
						_hover={{ color: "blue.500" }}
						cursor="pointer"
						onClick={handleSamePoint}
						opacity={isReacting ? 0.5 : 1}
					>
						<Text fontSize="xs" fontWeight="medium">
							Same point
						</Text>
						{samePointReactions.length > 0 && (
							<Text fontSize="xs">({samePointReactions.length})</Text>
						)}
					</HStack>
				)}

				{/* Good Point - only for opposite stance */}
				{!isSameStance && currentUserStance && !isOwnComment && (
					<HStack
						spacing={1}
						color={hasGoodPoint ? "purple.500" : mutedText}
						_hover={{ color: "purple.500" }}
						cursor="pointer"
						onClick={handleGoodPoint}
						opacity={isReacting ? 0.5 : 1}
					>
						<Text fontSize="xs" fontWeight="medium">
							Good point
						</Text>
						{goodPointReactions.length > 0 && (
							<Text fontSize="xs">({goodPointReactions.length})</Text>
						)}
					</HStack>
				)}

				{/* Show reaction counts when not interactive */}
				{(isOwnComment || !currentUserStance) && (
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
	);
};

export default CommentCard;