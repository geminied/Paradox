import {
	Box,
	Flex,
	Text,
	VStack,
	HStack,
	Button,
	Spinner,
	useColorModeValue,
	useDisclosure,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import MotionCard from "./MotionCard";
import AddMotionModal from "./AddMotionModal";

const MotionList = ({ tournament }) => {
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();
	const [motions, setMotions] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const { isOpen, onOpen, onClose } = useDisclosure();

	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const borderColor = useColorModeValue("gray.200", "#333333");

	const isOrganizer = user && tournament?.creator?._id === user._id;

	useEffect(() => {
		const fetchMotions = async () => {
			try {
				const endpoint = isOrganizer
					? `/api/motions/tournament/${tournament._id}`
					: `/api/motions/tournament/${tournament._id}/released`;

				const res = await fetch(endpoint);
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);

				setMotions(data);
			} catch (error) {
				showToast("Error", error.message, "error");
			} finally {
				setIsLoading(false);
			}
		};

		if (tournament?._id) {
			fetchMotions();
		}
	}, [tournament, isOrganizer, showToast]);

	const handleMotionAdded = (newMotion) => {
		setMotions((prev) => [...prev, newMotion].sort((a, b) => {
			// Sort by round type then round number
			const typeOrder = { preliminary: 0, octo: 1, quarterfinal: 2, semifinal: 3, final: 4 };
			if (typeOrder[a.roundType] !== typeOrder[b.roundType]) {
				return typeOrder[a.roundType] - typeOrder[b.roundType];
			}
			return a.round - b.round;
		}));
	};

	const handleMotionUpdate = (updatedMotion) => {
		setMotions((prev) =>
			prev.map((m) => (m._id === updatedMotion._id ? updatedMotion : m))
		);
	};

	const handleMotionDelete = (motionId) => {
		setMotions((prev) => prev.filter((m) => m._id !== motionId));
	};

	if (isLoading) {
		return (
			<Flex justify="center" py={8}>
				<Spinner />
			</Flex>
		);
	}

	// Group motions by round type
	const groupedMotions = motions.reduce((acc, motion) => {
		const key = motion.roundType;
		if (!acc[key]) acc[key] = [];
		acc[key].push(motion);
		return acc;
	}, {});

	const roundTypeLabels = {
		preliminary: "Preliminary Rounds",
		octo: "Octo-finals",
		quarterfinal: "Quarter-finals",
		semifinal: "Semi-finals",
		final: "Grand Final",
	};

	return (
		<Box>
			{/* Header */}
			<Flex justify="space-between" align="center" mb={4}>
				<Text fontWeight="semibold" color={textColor}>
					Motions
				</Text>
				{isOrganizer && (
					<Button
						size="sm"
						borderRadius="full"
						leftIcon={<FiPlus />}
						onClick={onOpen}
					>
						Add Motion
					</Button>
				)}
			</Flex>

			{/* Motions list */}
			{motions.length === 0 ? (
				<Box
					py={8}
					textAlign="center"
					border="1px dashed"
					borderColor={borderColor}
					borderRadius="3xl"
				>
					<Text color={mutedText}>
						{isOrganizer
							? "No motions yet. Add motions for each round."
							: "No motions released yet."}
					</Text>
				</Box>
			) : (
				<VStack spacing={6} align="stretch">
					{Object.entries(groupedMotions).map(([roundType, roundMotions]) => (
						<Box key={roundType}>
							<Text fontSize="sm" fontWeight="medium" color={mutedText} mb={3}>
								{roundTypeLabels[roundType] || roundType}
							</Text>
							<VStack spacing={3} align="stretch">
								{roundMotions.map((motion) => (
									<MotionCard
										key={motion._id}
										motion={motion}
										isOrganizer={isOrganizer}
										onUpdate={handleMotionUpdate}
										onDelete={handleMotionDelete}
									/>
								))}
							</VStack>
						</Box>
					))}
				</VStack>
			)}

			{/* Add Motion Modal */}
			<AddMotionModal
				isOpen={isOpen}
				onClose={onClose}
				tournament={tournament}
				onMotionAdded={handleMotionAdded}
			/>
		</Box>
	);
};

export default MotionList;
