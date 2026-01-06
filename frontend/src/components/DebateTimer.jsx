import {
	Box,
	Text,
	VStack,
	HStack,
	Badge,
	useColorModeValue,
	Progress,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiClock } from "react-icons/fi";

const DebateTimer = ({ debate }) => {
	const [timeRemaining, setTimeRemaining] = useState(0);
	const [totalTime, setTotalTime] = useState(0);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	useEffect(() => {
		const calculateTimeRemaining = () => {
			const now = new Date();

			if (debate.status === "prep" && debate.prepStartTime) {
				const prepStart = new Date(debate.prepStartTime);
				const prepEnd = new Date(prepStart.getTime() + debate.prepDuration * 60000);
				const remaining = Math.max(0, Math.floor((prepEnd - now) / 1000));
				setTimeRemaining(remaining);
				setTotalTime(debate.prepDuration * 60);
			} else if (debate.status === "in-progress" && debate.speechDeadline) {
				const deadline = new Date(debate.speechDeadline);
				const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
				setTimeRemaining(remaining);
				setTotalTime(debate.speechDuration * 60);
			}
		};

		calculateTimeRemaining();
		const interval = setInterval(calculateTimeRemaining, 1000);

		return () => clearInterval(interval);
	}, [debate]);

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const getTimerColor = () => {
		const percentage = (timeRemaining / totalTime) * 100;
		if (percentage > 50) return "green";
		if (percentage > 25) return "yellow";
		return "red";
	};

	return (
		<Box
			bg={cardBg}
			border="1px"
			borderColor={borderColor}
			borderRadius="3xl"
			p={6}
		>
			<VStack spacing={4}>
				<HStack>
					<FiClock size={20} />
					<Text fontSize="lg" fontWeight="semibold" color={textColor}>
						{debate.status === "prep" ? "Prep Time" : "Speech Time"}
					</Text>
					{debate.status === "in-progress" && (
						<Badge colorScheme="blue" borderRadius="full">
							Speech {debate.currentSpeechNumber}/{debate.totalSpeeches}
						</Badge>
					)}
				</HStack>

				<Text fontSize="4xl" fontWeight="bold" color={textColor}>
					{formatTime(timeRemaining)}
				</Text>

				<Progress
					value={(timeRemaining / totalTime) * 100}
					colorScheme={getTimerColor()}
					size="lg"
					width="100%"
					borderRadius="full"
				/>

				{timeRemaining === 0 && (
					<Badge colorScheme="red" fontSize="sm" borderRadius="full" px={3}>
						Time's Up!
					</Badge>
				)}

				<Text fontSize="sm" color={mutedText}>
					{debate.status === "prep"
						? `${Math.round(debate.prepDuration * 60)} second prep time`
						: `${Math.round(debate.speechDuration * 60)} seconds per speech`}
				</Text>
			</VStack>
		</Box>
	);
};

export default DebateTimer;
