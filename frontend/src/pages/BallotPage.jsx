import {
	Box,
	Button,
	Container,
	Flex,
	Heading,
	Text,
	VStack,
	HStack,
	Divider,
	useColorModeValue,
	Spinner,
	Badge,
	Select,
	NumberInput,
	NumberInputField,
	Textarea,
	useToast,
	Alert,
	AlertIcon,
	FormControl,
	FormLabel,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { FiArrowLeft, FiSave, FiSend, FiCheckCircle } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";
import DebateTranscript from "../components/DebateTranscript";

const BallotPage = () => {
	const { debateId } = useParams();
	const navigate = useNavigate();
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();

	const [debate, setDebate] = useState(null);
	const [speeches, setSpeeches] = useState([]);
	const [ballot, setBallot] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Ballot data
	const [rankings, setRankings] = useState([]);
	const [speakerScores, setSpeakerScores] = useState([]);
	const [teamFeedback, setTeamFeedback] = useState([]);
	const [overallFeedback, setOverallFeedback] = useState("");

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const highlightBg = useColorModeValue("blue.50", "#1a2733");

	useEffect(() => {
		fetchDebate();
		fetchSpeeches();
		fetchOrCreateBallot();
	}, [debateId]);

	// Auto-save every 30 seconds
	useEffect(() => {
		if (ballot && ballot.status === "draft") {
			const interval = setInterval(() => {
				saveDraft(true); // Silent save
			}, 30000);
			return () => clearInterval(interval);
		}
	}, [ballot, rankings, speakerScores, teamFeedback, overallFeedback]);

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
			if (!res.ok) throw new Error(data.error);
			setSpeeches(data);
		} catch (error) {
			console.log("Error fetching speeches:", error);
		}
	};

	const fetchOrCreateBallot = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/ballots/${debateId}/create`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			setBallot(data);
			
			// Initialize state from existing ballot
			if (data.rankings && data.rankings.length > 0) {
				setRankings(data.rankings);
			}
			if (data.speakerScores && data.speakerScores.length > 0) {
				setSpeakerScores(data.speakerScores);
			}
			if (data.teamFeedback && data.teamFeedback.length > 0) {
				setTeamFeedback(data.teamFeedback);
			}
			if (data.overallFeedback) {
				setOverallFeedback(data.overallFeedback);
			}
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const saveDraft = async (silent = false) => {
		if (!ballot || ballot.status === "submitted") return;

		setIsSaving(true);
		try {
			const res = await fetch(`/api/ballots/${ballot._id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					rankings,
					speakerScores,
					teamFeedback,
					overallFeedback,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			setBallot(data);
			if (!silent) {
				showToast("Success", "Draft saved", "success");
			}
		} catch (error) {
			if (!silent) {
				showToast("Error", error.message, "error");
			}
		} finally {
			setIsSaving(false);
		}
	};

	const submitBallot = async () => {
		if (!ballot) return;

		// Validation
		if (!debate || !debate.teams) {
			showToast("Error", "Debate data not loaded", "error");
			return;
		}

		if (rankings.length !== debate.teams.length) {
			showToast("Error", `Please rank all ${debate.teams.length} teams`, "error");
			return;
		}

		const totalSpeakers = debate.teams.reduce((sum, t) => sum + t.team.members.length, 0);
		if (speakerScores.length !== totalSpeakers) {
			showToast("Error", `Please score all ${totalSpeakers} speakers`, "error");
			return;
		}

		setIsSubmitting(true);
		try {
			// Save draft first
			await saveDraft(true);

			// Submit
			const res = await fetch(`/api/ballots/${ballot._id}/submit`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			showToast("Success", data.message, "success");
			setBallot(data.ballot);

			// Navigate back to debate room
			setTimeout(() => {
				navigate(`/debate-room/${debateId}`);
			}, 1500);
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleRankChange = (teamId, rank) => {
		const updatedRankings = rankings.filter(r => r.team !== teamId);
		updatedRankings.push({ team: teamId, rank: parseInt(rank) });
		setRankings(updatedRankings);
	};

	const handleSpeakerScoreChange = (speakerId, teamId, score) => {
		const updatedScores = speakerScores.filter(s => s.speaker !== speakerId);
		updatedScores.push({
			speaker: speakerId,
			team: teamId,
			score: parseFloat(score) || 0,
			breakdown: { content: 0, style: 0, strategy: 0 }
		});
		setSpeakerScores(updatedScores);
	};

	const handleTeamFeedbackChange = (teamId, field, value) => {
		const existingFeedback = teamFeedback.find(f => f.team === teamId);
		const updatedFeedback = teamFeedback.filter(f => f.team !== teamId);
		
		updatedFeedback.push({
			team: teamId,
			strengths: field === "strengths" ? value : (existingFeedback?.strengths || ""),
			weaknesses: field === "weaknesses" ? value : (existingFeedback?.weaknesses || ""),
			advice: field === "advice" ? value : (existingFeedback?.advice || ""),
		});
		
		setTeamFeedback(updatedFeedback);
	};

	const getRankForTeam = (teamId) => {
		const ranking = rankings.find(r => r.team === teamId);
		return ranking ? ranking.rank : "";
	};

	const getScoreForSpeaker = (speakerId) => {
		const score = speakerScores.find(s => s.speaker === speakerId);
		return score ? score.score : "";
	};

	const getFeedbackForTeam = (teamId) => {
		return teamFeedback.find(f => f.team === teamId) || { strengths: "", weaknesses: "", advice: "" };
	};

	if (isLoading) {
		return (
			<Container maxW="container.xl" py={8}>
				<Flex justify="center" align="center" h="50vh">
					<Spinner size="xl" />
				</Flex>
			</Container>
		);
	}

	if (!debate || !ballot) {
		return (
			<Container maxW="container.xl" py={8}>
				<Text>Debate or ballot not found</Text>
			</Container>
		);
	}

	const isSubmitted = ballot.status === "submitted";

	return (
		<Container maxW="container.xl" py={8}>
			<VStack align="stretch" spacing={6}>
				{/* Header */}
				<Flex justify="space-between" align="center">
					<HStack>
						<Button
							leftIcon={<FiArrowLeft />}
							variant="ghost"
							onClick={() => navigate(`/debate-room/${debateId}`)}
						>
							Back to Debate
						</Button>
						<Divider orientation="vertical" h="30px" />
						<Heading size="lg">Submit Ballot</Heading>
					</HStack>
					<HStack>
						{isSubmitted ? (
							<Badge colorScheme="green" fontSize="md" p={2}>
								<HStack spacing={1}>
									<FiCheckCircle />
									<Text>Submitted</Text>
								</HStack>
							</Badge>
						) : (
							<>
								<Button
									leftIcon={<FiSave />}
									onClick={() => saveDraft(false)}
									isLoading={isSaving}
									variant="outline"
								>
									Save Draft
								</Button>
								<Button
									leftIcon={<FiSend />}
									colorScheme="blue"
									onClick={submitBallot}
									isLoading={isSubmitting}
								>
									Submit Ballot
								</Button>
							</>
						)}
					</HStack>
				</Flex>

				{/* Status Alert */}
				{isSubmitted && (
					<Alert status="success" borderRadius="xl">
						<AlertIcon />
						Your ballot has been submitted successfully! You can view it but cannot edit.
					</Alert>
				)}

				{/* Debate Info */}
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="3xl"
					p={6}
				>
					<VStack align="stretch" spacing={3}>
						<Heading size="md">{debate.roomName}</Heading>
						<HStack>
							<Badge colorScheme="blue">
								{debate.tournament?.format || "BP"}
							</Badge>
							<Badge colorScheme={debate.status === "completed" ? "green" : "orange"}>
								{debate.status}
							</Badge>
						</HStack>
					</VStack>
				</Box>

				{/* Debate Transcript */}
				<Box>
					<Heading size="md" mb={4}>Debate Transcript</Heading>
					<DebateTranscript speeches={speeches} currentUser={user} />
				</Box>

				{/* Rankings */}
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="3xl"
					p={6}
				>
					<Heading size="md" mb={4}>Team Rankings</Heading>
					<VStack align="stretch" spacing={4}>
						{debate.teams?.map((teamData, idx) => (
							<HStack key={idx} justify="space-between">
								<VStack align="start" spacing={0} flex={1}>
									<Text fontWeight="bold">{teamData.team?.name}</Text>
									<Text fontSize="sm" color={mutedText}>
										{teamData.position} • {teamData.team?.institution}
									</Text>
								</VStack>
								<FormControl w="150px">
									<Select
										placeholder="Select rank"
										value={getRankForTeam(teamData.team?._id)}
										onChange={(e) => handleRankChange(teamData.team?._id, e.target.value)}
										isDisabled={isSubmitted}
									>
										<option value="1">1st Place</option>
										<option value="2">2nd Place</option>
										<option value="3">3rd Place</option>
										<option value="4">4th Place</option>
									</Select>
								</FormControl>
							</HStack>
						))}
					</VStack>
				</Box>

				{/* Speaker Scores */}
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="3xl"
					p={6}
				>
					<Heading size="md" mb={4}>Speaker Scores (70-80)</Heading>
					<VStack align="stretch" spacing={4}>
						{debate.teams?.map((teamData) => (
							<Box key={teamData.team?._id}>
								<Text fontWeight="bold" mb={2}>
									{teamData.team?.name} ({teamData.position})
								</Text>
								<VStack align="stretch" spacing={2} pl={4}>
									{teamData.team?.members?.map((member, idx) => (
										<HStack key={member._id} justify="space-between">
											<Text>{member.name}</Text>
											<FormControl w="150px">
												<NumberInput
													min={70}
													max={80}
													step={0.5}
													value={getScoreForSpeaker(member._id)}
													onChange={(value) => 
														handleSpeakerScoreChange(member._id, teamData.team._id, value)
													}
													isDisabled={isSubmitted}
												>
													<NumberInputField placeholder="70-80" />
												</NumberInput>
											</FormControl>
										</HStack>
									))}
								</VStack>
							</Box>
						))}
					</VStack>
				</Box>

				{/* Team Feedback */}
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="3xl"
					p={6}
				>
					<Heading size="md" mb={4}>Team Feedback</Heading>
					<VStack align="stretch" spacing={6}>
						{debate.teams?.map((teamData) => {
							const feedback = getFeedbackForTeam(teamData.team?._id);
							return (
								<Box key={teamData.team?._id}>
									<Text fontWeight="bold" mb={3}>
										{teamData.team?.name} ({teamData.position})
									</Text>
									<VStack align="stretch" spacing={3}>
										<FormControl>
											<FormLabel fontSize="sm">Strengths</FormLabel>
											<Textarea
												placeholder="What did this team do well?"
												value={feedback.strengths}
												onChange={(e) => 
													handleTeamFeedbackChange(teamData.team._id, "strengths", e.target.value)
												}
												isDisabled={isSubmitted}
												rows={2}
											/>
										</FormControl>
										<FormControl>
											<FormLabel fontSize="sm">Weaknesses</FormLabel>
											<Textarea
												placeholder="What could this team improve?"
												value={feedback.weaknesses}
												onChange={(e) => 
													handleTeamFeedbackChange(teamData.team._id, "weaknesses", e.target.value)
												}
												isDisabled={isSubmitted}
												rows={2}
											/>
										</FormControl>
										<FormControl>
											<FormLabel fontSize="sm">Advice</FormLabel>
											<Textarea
												placeholder="Advice for future debates"
												value={feedback.advice}
												onChange={(e) => 
													handleTeamFeedbackChange(teamData.team._id, "advice", e.target.value)
												}
												isDisabled={isSubmitted}
												rows={2}
											/>
										</FormControl>
									</VStack>
								</Box>
							);
						})}
					</VStack>
				</Box>

				{/* Overall Feedback */}
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="3xl"
					p={6}
				>
					<Heading size="md" mb={4}>Overall Comments</Heading>
					<Textarea
						placeholder="General observations about the debate..."
						value={overallFeedback}
						onChange={(e) => setOverallFeedback(e.target.value)}
						isDisabled={isSubmitted}
						rows={4}
					/>
				</Box>

				{/* Submit Button (bottom) */}
				{!isSubmitted && (
					<Flex justify="flex-end" gap={3}>
						<Button
							leftIcon={<FiSave />}
							onClick={() => saveDraft(false)}
							isLoading={isSaving}
							size="lg"
						>
							Save Draft
						</Button>
						<Button
							leftIcon={<FiSend />}
							colorScheme="blue"
							onClick={submitBallot}
							isLoading={isSubmitting}
							size="lg"
						>
							Submit Final Ballot
						</Button>
					</Flex>
				)}
			</VStack>
		</Container>
	);
};

export default BallotPage;
