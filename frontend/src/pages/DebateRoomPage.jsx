import {
	Box,
	Button,
	Flex,
	Text,
	VStack,
	HStack,
	Badge,
	Spinner,
	Avatar,
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
import DebateResults from "../components/DebateResults";

const DebateRoomPage = () => {
	const { debateId } = useParams();
	const navigate = useNavigate();
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();

	const [debate, setDebate] = useState(null);
	const [speeches, setSpeeches] = useState([]);
	const [ballotStatus, setBallotStatus] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isStarting, setIsStarting] = useState(false);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const motionBg = useColorModeValue("blue.50", "rgba(66, 153, 225, 0.1)");
	const motionBorderColor = useColorModeValue("blue.200", "rgba(66, 153, 225, 0.3)");
	const teamBg = useColorModeValue("gray.50", "#0a0a0a");
	const infoSlideBg = useColorModeValue("white", "#0a0a0a");

	useEffect(() => {
		const initialLoad = async () => {
			setIsLoading(true);
			await fetchDebate();
			await fetchSpeeches();
			await fetchBallotStatus();
			setIsLoading(false);
		};
		
		initialLoad();
		
		// Poll for updates every 500ms for real-time updates
		const interval = setInterval(() => {
			fetchDebate();
			fetchSpeeches();
			fetchBallotStatus();
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

	const fetchBallotStatus = async () => {
		try {
			const res = await fetch(`/api/ballots/debate/${debateId}/status`);
			const data = await res.json();
			if (res.ok) {
				setBallotStatus(data);
			}
		} catch (error) {
			console.error("Error fetching ballot status:", error);
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
			<Box py={6}>
				<Text color={mutedText} textAlign="center">Debate room not found</Text>
			</Box>
		);
	}

	return (
		<Box py={6}>
			{/* Back Button */}
			<HStack
				mb={4}
				cursor="pointer"
				onClick={() => navigate(`/tournament/${debate.tournament._id}/rounds`)}
				_hover={{ color: textColor }}
				color={mutedText}
				transition="all 0.2s"
			>
				<FiArrowLeft size={18} />
				<Text fontSize="sm">Back to Rounds</Text>
			</HStack>

			{/* Page Header */}
			<Box mb={6}>
				<Text fontSize="2xl" fontWeight="bold" color={textColor} mb={1}>
					{debate.roomName}
				</Text>
				<Text fontSize="sm" color={mutedText}>
					{debate.tournament.name} - Round {debate.round.roundNumber}
				</Text>
			</Box>

			<VStack align="stretch" spacing={6}>
				{/* Debate Info Card */}
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="2xl"
					p={5}
				>
					<VStack align="stretch" spacing={5}>
						<HStack justify="space-between">
							<Badge 
								colorScheme={getStatusColor(debate.status)} 
								variant="subtle" 
								borderRadius="full" 
								px={3}
								py={1}
								fontSize="sm"
								fontWeight="medium"
							>
								{debate.status}
							</Badge>
						</HStack>

						{/* Motion Display */}
						{debate.round?.motion && debate.round.motion.isReleased && (
							<Box
								p={4}
								borderRadius="xl"
								bg={motionBg}
								border="1px"
								borderColor={motionBorderColor}
							>
								<VStack align="start" spacing={3}>
									<Badge colorScheme="blue" variant="solid" borderRadius="full" fontSize="xs" px={2}>
										MOTION
									</Badge>
									<Text fontSize="lg" fontWeight="bold" color={textColor}>
										{debate.round.motion.motionText}
									</Text>
									{debate.round.motion.infoSlide && (
										<Box
											mt={2}
											p={3}
											bg={infoSlideBg}
											borderRadius="lg"
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
								<Text fontSize="xs" color={mutedText} mt={2}>
									Prep Time: {debate.round.motion.prepTime} minutes
								</Text>
								</VStack>
							</Box>
						)}

						<Divider />

						{/* Teams */}
						<Box>
							<Text fontWeight="semibold" fontSize="xs" color={mutedText} mb={3}>
								Teams:
							</Text>
							<VStack spacing={3} align="stretch">
								{debate.teams.map((teamInfo) => (
									<Box
										key={teamInfo.team._id}
										p={4}
										borderRadius="xl"
										bg={teamBg}
										border="1px"
										borderColor={borderColor}
									>
										<Flex justify="space-between" align="start" mb={3}>
											<HStack spacing={3}>
												<Badge 
													colorScheme="blue" 
													variant="solid" 
													borderRadius="md"
													px={2}
													py={1}
													fontSize="10px"
													fontWeight="bold"
													textTransform="uppercase"
												>
													{teamInfo.position}
												</Badge>
												<VStack align="start" spacing={0}>
													<Text fontSize="md" fontWeight="bold" color={textColor}>
														{teamInfo.team.name}
													</Text>
													<Text fontSize="xs" color={mutedText} fontWeight="medium">
														{teamInfo.team.institution}
													</Text>
												</VStack>
											</HStack>
										</Flex>
										{teamInfo.team.members && teamInfo.team.members.length > 0 && (
											<Box>
												<Text fontSize="xs" color={mutedText} mb={2} fontWeight="semibold">
													Members:
												</Text>
												<VStack align="stretch" spacing={2}>
													{teamInfo.team.members.map((member, idx) => (
														<HStack key={member._id} spacing={3} p={2} borderRadius="lg">
															<Avatar
																size="sm"
																name={member.name || member.username}
																src={member.profilePic}
															/>
															<VStack align="start" spacing={0} flex={1}>
																<HStack spacing={2}>
																	<Text fontSize="sm" fontWeight="semibold" color={textColor}>
																		{member.name}
																	</Text>
																	<Badge 
																		size="sm" 
																		colorScheme="gray" 
																		variant="subtle" 
																		borderRadius="full"
																		fontSize="xs"
																	>
																		Speaker {idx + 1}
																	</Badge>
																</HStack>
																<Text fontSize="xs" color={mutedText}>
																	@{member.username}
																</Text>
															</VStack>
														</HStack>
													))}
												</VStack>
											</Box>
										)}
									</Box>
								))}
							</VStack>
						</Box>

						{/* Judges */}
						{debate.judges && debate.judges.length > 0 && (
							<Box>
								<Text fontWeight="semibold" fontSize="xs" color={mutedText} mb={3}>
									Judges:
								</Text>
								<VStack align="stretch" spacing={2}>
									{debate.judges.map((judge) => (
										<HStack
											key={judge._id}
											spacing={3}
											p={2}
											borderRadius="lg"
										>
											<Avatar
												size="sm"
												name={judge.name}
												src={judge.profilePic}
											/>
											<VStack align="start" spacing={0} flex={1}>
												<HStack spacing={2}>
													<Text fontSize="sm" fontWeight="semibold" color={textColor}>
														{judge.name}
													</Text>
													{judge._id === debate.chair?._id && (
														<Badge
															colorScheme="purple"
															variant="solid"
															fontSize="xs"
															borderRadius="md"
															px={2}
														>
															CHAIR
														</Badge>
													)}
												</HStack>
												{judge.institution && (
													<Text fontSize="xs" color={mutedText}>
														{judge.institution}
													</Text>
												)}
											</VStack>
										</HStack>
									))}
								</VStack>
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
						borderRadius="2xl"
						p={5}
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

				{/* Judge Ballot Button & Status */}
				{isJudge && (debate.status === "submitted" || debate.status === "judging") && !debate.hasResults && (
					<Box
						bg={cardBg}
						border="1px"
						borderColor={borderColor}
						borderRadius="2xl"
						p={5}
					>
						<VStack spacing={3}>
							{ballotStatus && (
								<HStack spacing={2} w="full" justify="center">
									<Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
										Ballots: {ballotStatus.progress}
									</Badge>
									{ballotStatus.isComplete && (
										<Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
											✓ All Submitted
										</Badge>
									)}
								</HStack>
							)}
							<Text fontSize="sm" color={mutedText} textAlign="center">
								{ballotStatus?.ballots?.find(b => b.judge._id === user?._id)?.status === "submitted" 
									? "Your ballot submitted. Waiting for other judges."
									: "All speeches submitted. Ready for judging."}
							</Text>
							{ballotStatus?.ballots?.find(b => b.judge._id === user?._id)?.status !== "submitted" && (
								<Button
									colorScheme="purple"
									size="lg"
									onClick={() => navigate(`/ballot/${debateId}`)}
									borderRadius="full"
									w="full"
								>
									Submit Ballot
								</Button>
							)}
							{ballotStatus?.ballots?.find(b => b.judge._id === user?._id)?.status === "submitted" && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => navigate(`/ballot/${debateId}`)}
									borderRadius="full"
								>
									View My Ballot
								</Button>
							)}
						</VStack>
					</Box>
				)}

				{/* Control Buttons (for judges/creators) */}
				{canControl && (
					<Box
						bg={cardBg}
						border="1px"
						borderColor={borderColor}
						borderRadius="2xl"
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

				{/* Debate Results */}
				{debate.hasResults && debate.status === "completed" && (
					<DebateResults debate={debate} currentUser={user} />
				)}

				{/* Debate Transcript */}
				<DebateTranscript speeches={speeches} currentUser={user} />
			</VStack>
		</Box>
	);
};

export default DebateRoomPage;
