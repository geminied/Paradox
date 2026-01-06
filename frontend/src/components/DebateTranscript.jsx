import {
	Box,
	Text,
	VStack,
	HStack,
	Badge,
	useColorModeValue,
	Divider,
} from "@chakra-ui/react";
import { FiMessageSquare } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

const DebateTranscript = ({ speeches, currentUser }) => {
	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const highlightBg = useColorModeValue("blue.50", "#1a2733");

	if (!speeches || speeches.length === 0) {
		return (
			<Box
				bg={cardBg}
				border="1px"
				borderColor={borderColor}
				borderRadius="3xl"
				p={6}
			>
				<VStack py={8}>
					<FiMessageSquare size={48} color="gray" />
					<Text color={mutedText}>No speeches submitted yet</Text>
					<Text fontSize="sm" color={mutedText}>
						Speeches will appear here as they are submitted
					</Text>
				</VStack>
			</Box>
		);
	}

	return (
		<Box
			bg={cardBg}
			border="1px"
			borderColor={borderColor}
			borderRadius="3xl"
			p={6}
		>
			<VStack align="stretch" spacing={4}>
				<HStack>
					<FiMessageSquare size={20} />
					<Text fontSize="lg" fontWeight="semibold" color={textColor}>
						Debate Transcript
					</Text>
					<Badge colorScheme="blue" borderRadius="full">
						{speeches.length} {speeches.length === 1 ? "Speech" : "Speeches"}
					</Badge>
				</HStack>

				<Divider />

				<VStack align="stretch" spacing={4}>
					{speeches.map((speech, index) => (
						<Box
							key={speech._id}
							p={4}
							borderRadius="2xl"
							bg={speech.speaker._id === currentUser?._id ? highlightBg : useColorModeValue("gray.50", "#0a0a0a")}
							border="1px"
							borderColor={speech.speaker._id === currentUser?._id ? "blue.300" : borderColor}
						>
							<VStack align="stretch" spacing={2}>
								{/* Speech Header */}
								<HStack justify="space-between" flexWrap="wrap">
									<HStack>
										<Badge colorScheme="purple" variant="solid" borderRadius="full">
											Speech {speech.speechNumber}
										</Badge>
										<Badge colorScheme="blue" variant="outline" borderRadius="full">
											{speech.position}
										</Badge>
										<Text fontSize="sm" fontWeight="semibold" color={textColor}>
											{speech.speaker.name}
										</Text>
										<Text fontSize="xs" color={mutedText}>
											({speech.team.name})
										</Text>
									</HStack>
									<HStack>
										<Text fontSize="xs" color={mutedText}>
											{formatDistanceToNow(new Date(speech.submittedAt), { addSuffix: true })}
										</Text>
										{speech.isLate && (
											<Badge colorScheme="red" variant="subtle" borderRadius="full" fontSize="xs">
												Late
											</Badge>
										)}
									</HStack>
								</HStack>

								{/* Speech Content */}
								<Box
									p={3}
									borderRadius="lg"
									bg={useColorModeValue("white", "#101010")}
								>
									<Text
										fontSize="sm"
										color={textColor}
										whiteSpace="pre-wrap"
										lineHeight="1.6"
									>
										{speech.content}
									</Text>
								</Box>

								{/* Duration (if tracked) */}
								{speech.duration > 0 && (
									<Text fontSize="xs" color={mutedText}>
										Duration: {Math.floor(speech.duration / 60)}:{(speech.duration % 60).toString().padStart(2, "0")}
									</Text>
								)}
							</VStack>
						</Box>
					))}
				</VStack>
			</VStack>
		</Box>
	);
};

export default DebateTranscript;
