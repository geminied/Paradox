import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalBody,
	Box,
	Flex,
	Text,
	Button,
	Textarea,
	VStack,
	HStack,
	Avatar,
	Divider,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { FiThumbsUp, FiThumbsDown } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const AddCommentModal = ({ isOpen, onClose, debateId, debateTitle, parentComment, onCommentCreated }) => {
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();
	const textRef = useRef(null);
	
	const [text, setText] = useState("");
	const [stance, setStance] = useState(null);
	const [isLoading, setIsLoading] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const quoteBg = useColorModeValue("gray.50", "#1a1a1a");

	const isReply = !!parentComment;

	// Auto-resize textarea
	useEffect(() => {
		if (textRef.current) {
			textRef.current.style.height = "auto";
			textRef.current.style.height = textRef.current.scrollHeight + "px";
		}
	}, [text]);

	// Focus textarea when modal opens
	useEffect(() => {
		if (isOpen && textRef.current) {
			setTimeout(() => textRef.current?.focus(), 100);
		}
	}, [isOpen]);

	const handleSubmit = async () => {
		if (!text.trim() || !stance) {
			showToast("Error", "Please write your argument and choose a stance", "error");
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch(`/api/comments/${debateId}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					text: text.trim(),
					stance,
					parentCommentId: parentComment?._id || null,
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Comment posted!", "success");
			onCommentCreated(data);
			handleClose();
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setText("");
		setStance(null);
		onClose();
	};

	const canPost = text.trim() && stance;

	return (
		<Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
			<ModalOverlay bg="blackAlpha.700" />
			<ModalContent
				bg={cardBg}
				border="1px"
				borderColor={borderColor}
				borderRadius="2xl"
				mx={4}
				maxW="500px"
			>
				{/* Header */}
				<Flex justify="space-between" align="center" p={4}>
					<Text
						color={mutedText}
						fontSize="sm"
						cursor="pointer"
						onClick={handleClose}
						_hover={{ color: textColor }}
					>
						Cancel
					</Text>
					<Text fontWeight="semibold" color={textColor}>
						{isReply ? "Reply" : "Add comment"}
					</Text>
					<Box w="50px" />
				</Flex>

				<Divider borderColor={borderColor} />

				<ModalBody p={4}>
					<VStack spacing={4} align="stretch">
						{/* Show what user is responding to */}
						<Box
							bg={quoteBg}
							borderRadius="lg"
							p={3}
							border=".5px dashed"
							borderColor={isReply ? "white.500" : "white.500"}
						>
							<Text fontSize="xs" color={mutedText} mb={1}>
								{isReply ? "Replying to comment:" : "Responding to debate:"}
							</Text>
							{isReply && parentComment ? (
								<>
									<HStack spacing={2} mb={1}>
										<Avatar size="xs" name={parentComment.author?.name} />
										<Text fontSize="xs" fontWeight="semibold" color={textColor}>
											{parentComment.author?.name}
										</Text>
									</HStack>
									<Text fontSize="sm" color={textColor} noOfLines={2}>
										"{parentComment.text}"
									</Text>
								</>
							) : (
								<Text fontSize="sm" fontWeight="medium" color={textColor} noOfLines={2}>
									"{debateTitle}"
								</Text>
							)}
						</Box>

						{/* User row with input */}
						<HStack spacing={3} align="flex-start">
							<Avatar size="sm" name={user?.name} mt={1} />
							<VStack align="start" spacing={2} flex={1}>
								<Text fontWeight="semibold" fontSize="sm" color={textColor}>
									{user?.username || "anonymous"}
								</Text>
								
								{/* Comment input */}
								<Textarea
									ref={textRef}
									placeholder="What's your argument?"
									value={text}
									onChange={(e) => setText(e.target.value)}
									variant="unstyled"
									fontSize="sm"
									color={textColor}
									_placeholder={{ color: mutedText }}
									resize="none"
									minH="60px"
									overflow="hidden"
									p={0}
								/>
							</VStack>
						</HStack>

						{/* Stance Selection - context-aware */}
						<Box pt={2}>
							<Text fontSize="xs" color={mutedText} mb={3}>
								{isReply 
									? "Do you agree with this comment?" 
									: "What's your stance on this topic?"
								}
							</Text>
							<HStack spacing={3}>
								<Button
									flex={1}
									leftIcon={<FiThumbsUp />}
									variant={stance === "agree" ? "solid" : "outline"}
									colorScheme="green"
									size="sm"
									fontWeight="medium"
									onClick={() => setStance("agree")}
									_hover={stance !== "agree" ? { bg: "green.50", borderColor: "green.500" } : {}}
								>
									{isReply ? "Agree" : "Agree"}
								</Button>
								<Button
									flex={1}
									leftIcon={<FiThumbsDown />}
									variant={stance === "disagree" ? "solid" : "outline"}
									colorScheme="red"
									size="sm"
									fontWeight="medium"
									onClick={() => setStance("disagree")}
									_hover={stance !== "disagree" ? { bg: "red.50", borderColor: "red.500" } : {}}
								>
									{isReply ? "Disagree" : "Disagree"}
								</Button>
							</HStack>
						</Box>
					</VStack>
				</ModalBody>

				<Divider borderColor={borderColor} />

				{/* Footer */}
				<Flex justify="flex-end" align="center" p={4}>
					<Button
						bg={canPost ? textColor : "transparent"}
						color={canPost ? cardBg : mutedText}
						border={canPost ? "none" : "1px"}
						borderColor={borderColor}
						fontWeight="semibold"
						borderRadius="3xl"
						px={6}
						size="sm"
						_hover={{ opacity: canPost ? 0.8 : 1 }}
						isDisabled={!canPost}
						isLoading={isLoading}
						onClick={handleSubmit}
					>
						Post
					</Button>
				</Flex>
			</ModalContent>
		</Modal>
	);
};

export default AddCommentModal;