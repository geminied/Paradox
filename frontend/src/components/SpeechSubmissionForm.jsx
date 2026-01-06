import {
	Box,
	Button,
	Textarea,
	VStack,
	Text,
	useColorModeValue,
	FormControl,
	FormLabel,
	Badge,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiSend } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const SpeechSubmissionForm = ({ debateId, currentSpeechNumber, onSpeechSubmitted }) => {
	const showToast = useShowToast();
	const [content, setContent] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	const handleSubmit = async () => {
		if (!content.trim()) {
			showToast("Error", "Please enter your speech content", "error");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/speeches/${debateId}/submit`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					content: content.trim(),
					duration: 0, // Could add timer functionality later
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", "Speech submitted successfully!", "success");
			setContent("");
			if (onSpeechSubmitted) {
				onSpeechSubmitted();
			}
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Box
			bg={cardBg}
			border="1px"
			borderColor={borderColor}
			borderRadius="3xl"
			p={6}
		>
			<VStack align="stretch" spacing={4}>
				<Text fontSize="lg" fontWeight="semibold" color={textColor}>
					Submit Your Speech
					<Badge ml={2} colorScheme="blue" borderRadius="full">
						Speech {currentSpeechNumber}
					</Badge>
				</Text>
				
				<FormControl>
					<FormLabel color={mutedText} fontSize="sm">
						Speech Content
					</FormLabel>
					<Textarea
						placeholder="Enter your speech content here (arguments, points, rebuttals, etc.)"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						minH="200px"
						borderRadius="xl"
						resize="vertical"
					/>
					<Text fontSize="xs" color={mutedText} mt={1}>
						{content.length} characters
					</Text>
				</FormControl>

				<Button
					leftIcon={<FiSend />}
					colorScheme="blue"
					onClick={handleSubmit}
					isLoading={isSubmitting}
					borderRadius="full"
					isDisabled={!content.trim()}
				>
					Submit Speech
				</Button>
			</VStack>
		</Box>
	);
};

export default SpeechSubmissionForm;
