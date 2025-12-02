import {
	Box,
	Flex,
	Text,
	VStack,
	Spinner,
	useDisclosure,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import DebateCard from "../components/DebateCard";
import CreateDebateModal from "../components/createDebateModal";
import useShowToast from "../hooks/useShowToast";

const HomePage = () => {
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();
	const { isOpen, onOpen, onClose } = useDisclosure();
	
	const [debates, setDebates] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const hoverBg = useColorModeValue("gray.50", "#1a1a1a");

	// Fetch debates on mount
	useEffect(() => {
		const fetchDebates = async () => {
			setIsLoading(true);
			try {
				const res = await fetch("/api/debates/feed");
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				setDebates(data);
			} catch (error) {
				showToast("Error", error.message, "error");
			} finally {
				setIsLoading(false);
			}
		};

		fetchDebates();
	}, [showToast]);

	const handleDebateCreated = (newDebate) => {
		setDebates([newDebate, ...debates]);
	};

	return (
		<Box>
			{/* Create Debate Input - Threads style */}
			{user && (
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="xl"
					p={4}
					mb={6}
					cursor="pointer"
					onClick={onOpen}
					_hover={{ bg: hoverBg }}
					transition="all 0.15s"
				>
					<Flex justify="space-between" align="center">
						<Text color={mutedText} fontSize="sm">
							Start a debate...
						</Text>
						<Box
							as="span"
							bg={textColor}
							color={cardBg}
							fontWeight="semibold"
							borderRadius="lg"
							px={4}
							py={1.5}
							fontSize="sm"
						>
							Post
						</Box>
					</Flex>
				</Box>
			)}

			{/* Loading state */}
			{isLoading && (
				<Flex justify="center" py={10}>
					<Spinner size="lg" />
				</Flex>
			)}

			{/* Empty state */}
			{!isLoading && debates.length === 0 && (
				<Flex justify="center" align="center" py={10}>
					<Text color={mutedText}>No debates yet. Start one!</Text>
				</Flex>
			)}

			{/* Debates Feed */}
			{!isLoading && debates.length > 0 && (
				<VStack spacing={4} align="stretch">
					{debates.map((debate) => (
						<DebateCard key={debate._id} debate={debate} />
					))}
				</VStack>
			)}

			{/* Create Debate Modal */}
			<CreateDebateModal
				isOpen={isOpen}
				onClose={onClose}
				onDebateCreated={handleDebateCreated}
			/>
		</Box>
	);
};

export default HomePage;