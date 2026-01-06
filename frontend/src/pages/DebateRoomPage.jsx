import {
	Box,
	Button,
	Flex,
	Text,
	VStack,
	HStack,
	Badge,
	Spinner,
	useColorModeValue,
	Divider,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { FiArrowLeft, FiClock, FiPlay, FiSkipForward, FiCheck } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";
import DebateTimer from "../components/DebateTimer";
import SpeechSubmissionForm from "../components/SpeechSubmissionForm";
import DebateTranscript from "../components/DebateTranscript";

const DebateRoomPage = () => {
	const { debateId } = useParams();
	const navigate = useNavigate();
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();

	const [debate, setDebate] = useState(null);
	const [speeches, setSpeeches] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isStarting, setIsStarting] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	useEffect(() => {
		const initialLoad = async () => {
			setIsLoading(true);
			await fetchDebate();
			await fetchSpeeches();
			setIsLoading(false);
		};
		
		initialLoad();
		
		// Poll for updates every 500ms for real-time updates
		const interval = setInterval(() => {
			fetchDebate();
			fetchSpeeches();
		}, 500);

		return () => clearInterval(interval);
	}, [debateId]);

	const fetchDebate = async () => {
		try {
			const res = await fetch(`/api/debate-rooms/${debateId}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			setDebate(data);
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	const fetchSpeeches = async () => {
		try {
			const res = await fetch(`/api/speeches/${debateId}`);
			const data = await res.json();
			if (res.ok) {
				setSpeeches(data);
			}
		} catch (error) {
			console.error(error);
		}
	};

	const handleStartPrep = async () => {
		setIsStarting(true);
		try {
			const res = await fetch(`/api/debate-rooms/${debateId}/start-prep`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			showToast("Success", "Prep time started!", "success");
			setDebate(data);
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsStarting(false);
		}
	};

	const handleStartDebate = async () => {
		setIsStarting(true);
		try {
			const res = await fetch(`/api/debate-rooms/${debateId}/start-debate`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			showToast("Success", "Debate started!", "success");
			setDebate(data);
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsStarting(false);
		}
	};

	const handleAdvanceTurn = async () => {
		try {
			const res = await fetch(`/api/debate-rooms/${debateId}/advance-turn`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			showToast("Success", "Advanced to next speech", "success");
			setDebate(data);
			// Immediately fetch again to ensure we have latest data
			await fetchDebate();
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	const handleCompleteDebate = async () => {
		try {
			const res = await fetch(`/api/debate-rooms/${debateId}/complete`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			showToast("Success", "Debate completed! Judges can now submit ballots.", "success");
			setDebate(data);
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	const getStatusColor = (status) => {
		const colors = {
			scheduled: "gray",
			prep: "blue",
			"in-progress": "green",
			submitted: "orange",
			judging: "purple",
			completed: "teal",
		};
		return colors[status] || "gray";
	};

	const isJudge = debate?.judges?.some(j => j._id === user?._id) || debate?.chair?._id === user?._id;
	const isCreator = debate?.tournament?.creator === user?._id;
	const canControl = isJudge || isCreator;

	// Check if current user is a participant
	const userTeam = debate?.teams?.find(teamInfo => {
		return teamInfo.team.members?.some(m => m._id === user?._id);
	});

	// Auto-start debate after prep time
	useEffect(() => {
		if (!debate || debate.status !== "prep" || !debate.prepStartTime || !canControl) return;

		const checkPrepTime = () => {
			const now = new Date();
			const prepStart = new Date(debate.prepStartTime);
			const prepEnd = new Date(prepStart.getTime() + debate.prepDuration * 60000);
			
			if (now >= prepEnd) {
				// Auto-start debate
				handleStartDebate();
			}
		};

		const timer = setInterval(checkPrepTime, 1000);
		return () => clearInterval(timer);
	}, [debate, canControl]);

	// Auto-advance to next speech when time is up
	useEffect(() => {
		if (!debate || debate.status !== "in-progress" || !debate.speechDeadline || !canControl) return;

		const checkSpeechTime = () => {
			const now = new Date();
			const deadline = new Date(debate.speechDeadline);
			
			if (now >= deadline) {
				// Auto-advance to next speech
				handleAdvanceTurn();
			}
		};

		const timer = setInterval(checkSpeechTime, 1000);
		return () => clearInterval(timer);
	}, [debate, canControl]);

	if (isLoading) {
		return (
			<Flex justify="center" align="center" minH="60vh">
				<Spinner size="xl" />
			</Flex>
		);
	}

	if (!debate) {
		return (
			<Box maxW="800px" mx="auto" py={8} px={4}>
				<Text>Debate room not found</Text>
			</Box>
		);
	}

	return (
		<Box maxW="1200px" mx="auto" py={8} px={4}>
			{/* Header */}
			<HStack mb={6}>
				<Button
					variant="ghost"
					leftIcon={<FiArrowLeft />}
					onClick={() => navigate(`/tournament/${debate.tournament._id}/rounds`)}
					size="sm"
				>
					Back
				</Button>
			</HStack>

			<VStack align="stretch" spacing={6}>
				{/* Debate Info Card */}
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="3xl"
					p={6}
				>
					<VStack align="stretch" spacing={4}>
						<HStack justify="space-between">
							<VStack align="start" spacing={0}>
								<Text fontSize="2xl" fontWeight="bold" color={textColor}>
									{debate.roomName}
								</Text>
								<Text fontSize="sm" color={mutedText}>
									{debate.tournament.name} - Round {debate.round.roundNumber}
								</Text>
							</VStack>
							<Badge colorScheme={getStatusColor(debate.status)} variant="subtle" borderRadius="full" px={3}>
								{debate.status}
							</Badge>
						</HStack>

						{/* Motion Display */}
						{debate.round?.motion && debate.round.motion.isReleased && (
							<Box
								p={4}
								borderRadius="lg"
								bg={useColorModeValue("blue.50", "rgba(66, 153, 225, 0.1)")}
								border="1px"
								borderColor={useColorModeValue("blue.200", "rgba(66, 153, 225, 0.3)")}
							>
								<VStack align="start" spacing={2}>
									<Badge colorScheme="blue" variant="solid" borderRadius="full" fontSize="xs">
										MOTION
									</Badge>
									<Text fontSize="lg" fontWeight="bold" color={textColor}>
										{debate.round.motion.motionText}
									</Text>
									{debate.round.motion.infoSlide && (
										<Box
											mt={2}
											p={3}
											bg={useColorModeValue("white", "#0a0a0a")}
											borderRadius="md"
											w="100%"
										>
											<Text fontSize="xs" fontWeight="semibold" color={mutedText} mb={1}>
												Info Slide
											</Text>
											<Text fontSize="sm" color={textColor}>
												{debate.round.motion.infoSlide}
											</Text>
										</Box>
									)}
									<HStack spacing={4} mt={1}>
										<Text fontSize="xs" color={mutedText}>
											Prep Time: {debate.round.motion.prepTime} minutes
										</Text>
									</HStack>
								</VStack>
							</Box>
						)}

						<Divider />

						{/* Teams */}
						<Box>
							<Text fontWeight="semibold" fontSize="sm" color={textColor} mb={2}>
								Teams
							</Text>
							<VStack spacing={2} align="stretch">
								{debate.teams.map((teamInfo) => (
									<Box
										key={teamInfo.team._id}
										p={3}
										borderRadius="lg"
										bg={useColorModeValue("gray.50", "#0a0a0a")}
									>
										<HStack spacing={2} mb={2}>
											<Badge colorScheme="blue" variant="solid" borderRadius="full">
												{teamInfo.position}
											</Badge>
											<Text fontSize="sm" fontWeight="semibold" color={textColor}>
												{teamInfo.team.name}
											</Text>
										</HStack>
										<Text fontSize="xs" color={mutedText} mb={1}>
											{teamInfo.team.institution}
										</Text>
										{teamInfo.team.members && teamInfo.team.members.length > 0 && (
											<VStack align="start" spacing={1} mt={2}>
												{teamInfo.team.members.map((member, idx) => (
													<HStack key={member._id} spacing={2}>
														<Badge size="sm" colorScheme="gray" variant="subtle" borderRadius="full">
															Speaker {idx + 1}
														</Badge>
														<Text fontSize="xs" color={textColor}>
															{member.name}
														</Text>
													</HStack>
												))}
											</VStack>
										)}
									</Box>
								))}
							</VStack>
						</Box>

						{/* Judges */}
						{debate.judges && debate.judges.length > 0 && (
							<Box>
								<Text fontWeight="semibold" fontSize="sm" color={textColor} mb={2}>
									Judges
								</Text>
								<HStack spacing={2} flexWrap="wrap">
									{debate.judges.map((judge) => (
										<Badge
											key={judge._id}
											variant="outline"
											borderRadius="full"
											colorScheme={judge._id === debate.chair?._id ? "purple" : "gray"}
										>
											{judge.name}
											{judge._id === debate.chair?._id && " (Chair)"}
										</Badge>
									))}
								</HStack>
							</Box>
						)}
					</VStack>
				</Box>

				{/* Timer */}
				{(debate.status === "prep" || debate.status === "in-progress") && (
					<DebateTimer debate={debate} />
				)}

				{/* Current Speaker Indicator */}
				{debate.status === "in-progress" && debate.currentSpeaker && (
					<Box
						bg={cardBg}
						border="2px"
						borderColor="blue.400"
						borderRadius="3xl"
						p={4}
					>
						<VStack spacing={2}>
							<Badge colorScheme="blue" variant="solid" borderRadius="full" fontSize="sm" px={3}>
								Current Turn
							</Badge>
							<Text fontSize="lg" fontWeight="bold" color={textColor}>
								{debate.currentSpeaker.name}
							</Text>
							<Text fontSize="sm" color={mutedText}>
								Speech {debate.currentSpeechNumber} of {debate.totalSpeeches}
							</Text>
						</VStack>
					</Box>
				)}

				{/* Speech Submission Form (for current speaker only) */}
				{debate.status === "in-progress" && 
				 userTeam && 
				 debate.currentSpeaker && 
				 debate.currentSpeaker._id === user?._id && (
					<SpeechSubmissionForm
					debateId={debateId}
					currentSpeechNumber={debate.currentSpeechNumber}
					onSpeechSubmitted={() => {
						fetchDebate();
						fetchSpeeches();
					}}
				/>
				)}

				{/* Control Buttons (for judges/creators) */}
				{canControl && (
					<Box
						bg={cardBg}
						border="1px"
						borderColor={borderColor}
						borderRadius="3xl"
						p={4}
					>
						<HStack spacing={3}>
							{debate.status === "scheduled" && (
								<Button
									leftIcon={<FiPlay />}
									colorScheme="blue"
									onClick={handleStartPrep}
									isLoading={isStarting}
									borderRadius="full"
								>
									Start Prep Time
								</Button>
							)}
							{debate.status === "prep" && (
								<Button
									leftIcon={<FiPlay />}
									colorScheme="green"
									onClick={handleStartDebate}
									isLoading={isStarting}
									borderRadius="full"
								>
									Start Debate
								</Button>
							)}
							{debate.status === "in-progress" && (
								<>
									<Button
										leftIcon={<FiSkipForward />}
										variant="outline"
										onClick={handleAdvanceTurn}
										borderRadius="full"
									>
										Next Speech ({debate.currentSpeechNumber}/{debate.totalSpeeches})
									</Button>
									<Button
										leftIcon={<FiCheck />}
										colorScheme="green"
										onClick={handleCompleteDebate}
										borderRadius="full"
									>
										Complete Debate
									</Button>
								</>
							)}
						</HStack>
					</Box>
				)}

				{/* Debate Transcript */}
				<DebateTranscript speeches={speeches} currentUser={user} />
			</VStack>
		</Box>
	);
};

export default DebateRoomPage;
