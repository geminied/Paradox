import {
	Box,
	Flex,
	Text,
	VStack,
	HStack,
	Spinner,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import DebateCard from "../components/DebateCard";
import useShowToast from "../hooks/useShowToast";
import { FiArrowLeft, FiBookmark } from "react-icons/fi";

const SavedDebatesPage = () => {
	const currentUser = useRecoilValue(userAtom);
	const navigate = useNavigate();
	const showToast = useShowToast();

	const [bookmarkedDebates, setBookmarkedDebates] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");

	useEffect(() => {
		const fetchBookmarks = async () => {
			if (!currentUser) return;
			
			setIsLoading(true);
			try {
				const res = await fetch("/api/users/bookmarks");
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				setBookmarkedDebates(data);
			} catch (error) {
				showToast("Error", error.message, "error");
			} finally {
				setIsLoading(false);
			}
		};

		fetchBookmarks();
	}, [currentUser, showToast]);

	return (
		<Box pt={6} pb={8}>
			{/* Back button */}
			<HStack
				mb={4}
				cursor="pointer"
				onClick={() => navigate("/")}
				_hover={{ color: textColor }}
				color={mutedText}
			>
				<FiArrowLeft size={18} />
				<Text fontSize="sm">Back to debates</Text>
			</HStack>

			{/* Page Header */}
			<Box
				bg={cardBg}
				border="1px"
				borderColor={borderColor}
				borderRadius="3xl"
				p={5}
				mb={6}
			>
				<HStack spacing={3}>
					<Box
						bg="yellow.500"
						p={2}
						borderRadius="full"
						color="white"
					>
						<FiBookmark size={20} />
					</Box>
					<Box>
						<Text fontWeight="bold" fontSize="lg" color={textColor}>
							Saved Debates
						</Text>
						<Text fontSize="sm" color={mutedText}>
							{bookmarkedDebates.length} saved debate{bookmarkedDebates.length !== 1 ? "s" : ""}
						</Text>
					</Box>
				</HStack>
			</Box>

			{/* Loading State */}
			{isLoading && (
				<Flex justify="center" py={10}>
					<Spinner size="lg" />
				</Flex>
			)}

			{/* Empty State */}
			{!isLoading && bookmarkedDebates.length === 0 && (
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="3xl"
					p={8}
					textAlign="center"
				>
					<Box
						mx="auto"
						mb={4}
						w={16}
						h={16}
						bg="gray.100"
						_dark={{ bg: "gray.800" }}
						borderRadius="full"
						display="flex"
						alignItems="center"
						justifyContent="center"
					>
						<FiBookmark size={28} color="gray" />
					</Box>
					<Text fontWeight="semibold" color={textColor} mb={2}>
						No saved debates yet
					</Text>
					<Text fontSize="sm" color={mutedText}>
						Bookmark debates you want to revisit later by clicking the bookmark icon.
					</Text>
				</Box>
			)}

			{/* Bookmarked Debates List */}
			{!isLoading && bookmarkedDebates.length > 0 && (
				<VStack spacing={4} align="stretch">
					{bookmarkedDebates.map((debate) => (
						<DebateCard key={debate._id} debate={debate} />
					))}
				</VStack>
			)}
		</Box>
	);
};

export default SavedDebatesPage;
