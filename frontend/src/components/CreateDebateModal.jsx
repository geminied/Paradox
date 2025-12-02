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
import TopicSelector from "./TopicSelector";
import useShowToast from "../hooks/useShowToast";

const MAX_TITLE_WORDS = 20;

const CreateDebateModal = ({ isOpen, onClose, onDebateCreated }) => {
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();
	const contextRef = useRef(null);
	
	const [category, setCategory] = useState("");
	const [title, setTitle] = useState("");
	const [context, setContext] = useState("");
	const [showContext, setShowContext] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	// Auto-resize context textarea
	useEffect(() => {
		if (contextRef.current) {
			contextRef.current.style.height = "auto";
			contextRef.current.style.height = contextRef.current.scrollHeight + "px";
		}
	}, [context]);

	// Handle title input with word limit
	const handleTitleChange = (e) => {
		const text = e.target.value;
		const words = text.split(/\s+/).filter(w => w.length > 0);
		
		if (words.length <= MAX_TITLE_WORDS) {
			setTitle(text);
		}
		// If over limit, don't update - block further input
	};

	const wordCount = title.trim() ? title.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

	const handleSubmit = async () => {
		if (!category.trim() || !title.trim()) {
			showToast("Error", "Topic and debate question are required", "error");
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch("/api/debates/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					category: category.trim(),
					title: title.trim(),
					context: context.trim(),
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Debate created!", "success");
			onDebateCreated(data);
			handleClose();
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setCategory("");
		setTitle("");
		setContext("");
		setShowContext(false);
		onClose();
	};

	const canPost = category.trim() && title.trim();

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
						New debate
					</Text>
					<Box w="50px" />
				</Flex>

				<Divider borderColor={borderColor} />

				<ModalBody p={4}>
					<VStack spacing={4} align="stretch">
						{/* User row with topic selector - Threads style */}
						<HStack spacing={3} align="flex-start">
							<Avatar size="sm" name={user?.name} mt={1} />
							<VStack align="start" spacing={1} flex={1}>
								<HStack spacing={1}>
									<Text fontWeight="semibold" fontSize="sm" color={textColor}>
										{user?.username || "anonymous"}
									</Text>
									<TopicSelector
										value={category}
										onChange={setCategory}
										placeholder="Add a topic"
									/>
								</HStack>
								
								{/* Debate question input */}
								<Box w="full">
									<Textarea
										placeholder="What's the debate?"
										value={title}
										onChange={handleTitleChange}
										variant="unstyled"
										fontSize="sm"
										color={textColor}
										_placeholder={{ color: mutedText }}
										resize="none"
										minH="40px"
										p={0}
									/>
									<Text fontSize="xs" color={wordCount >= MAX_TITLE_WORDS ? "red.400" : mutedText}>
										{wordCount}/{MAX_TITLE_WORDS} words
									</Text>
								</Box>

								{/* Context input - inline, auto-grow */}
								{showContext ? (
									<Textarea
										ref={contextRef}
										placeholder="Add background or context..."
										value={context}
										onChange={(e) => setContext(e.target.value)}
										variant="unstyled"
										fontSize="sm"
										color={textColor}
										_placeholder={{ color: mutedText }}
										resize="none"
										minH="24px"
										overflow="hidden"
										p={0}
										mt={2}
										autoFocus
									/>
								) : (
									<Text 
										fontSize="sm" 
										color={mutedText}
										cursor="pointer"
										onClick={() => setShowContext(true)}
										_hover={{ color: textColor }}
										mt={2}
									>
										Add context...
									</Text>
								)}
							</VStack>
						</HStack>
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
						borderRadius="lg"
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

export default CreateDebateModal;