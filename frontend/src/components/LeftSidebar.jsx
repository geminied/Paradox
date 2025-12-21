import {
	Box,
	VStack,
	Text,
	HStack,
	Flex,
	Spinner,
	Button,
	Avatar,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { FiUsers } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const LeftSidebar = () => {
	const showToast = useShowToast();
	const navigate = useNavigate();
	const currentUser = useRecoilValue(userAtom);

	const [suggestedUsers, setSuggestedUsers] = useState([]);
	const [isLoadingUsers, setIsLoadingUsers] = useState(true);
	const [followingUsers, setFollowingUsers] = useState({});

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	// Fetch suggested users to follow
	useEffect(() => {
		const fetchSuggestedUsers = async () => {
			if (!currentUser) {
				setIsLoadingUsers(false);
				return;
			}
			try {
				const res = await fetch("/api/users/suggested");
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				setSuggestedUsers(data);
			} catch (error) {
				console.error("Error fetching suggested users:", error);
			} finally {
				setIsLoadingUsers(false);
			}
		};

		fetchSuggestedUsers();
	}, [currentUser]);

	// Handle follow user
	const handleFollow = async (userId) => {
		if (!currentUser) {
			showToast("Error", "Please login to follow users", "error");
			return;
		}
		
		setFollowingUsers((prev) => ({ ...prev, [userId]: true }));
		
		try {
			const res = await fetch(`/api/users/follow/${userId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			// Remove user from suggestions after following
			setSuggestedUsers((prev) => prev.filter((u) => u._id !== userId));
			showToast("Success", data.message, "success");
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setFollowingUsers((prev) => ({ ...prev, [userId]: false }));
		}
	};

	if (!currentUser) return null;

	return (
		<Box w="240px" flexShrink={0}>
			<VStack spacing={4} align="stretch">
				{/* Who to Follow Section */}
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="3xl"
					overflow="hidden"
				>
					<HStack spacing={2} p={4} borderBottom="1px" borderColor={borderColor}>
						<FiUsers color="#38A169" />
						<Text fontWeight="semibold" fontSize="sm" color={textColor}>
							Who to Follow
						</Text>
					</HStack>

					{isLoadingUsers ? (
						<Flex justify="center" py={6}>
							<Spinner size="sm" />
						</Flex>
					) : suggestedUsers.length === 0 ? (
						<Box p={4}>
							<Text fontSize="xs" color={mutedText}>
								No suggestions - you're following everyone!
							</Text>
						</Box>
					) : (
						<VStack spacing={0} align="stretch">
							{suggestedUsers.slice(0, 5).map((user, index) => (
								<Box
									key={user._id}
									px={4}
									py={3}
									borderBottom={index < Math.min(suggestedUsers.length, 5) - 1 ? "1px" : "none"}
									borderColor={borderColor}
								>
									<Flex justify="space-between" align="center">
										<HStack 
											spacing={3} 
											cursor="pointer"
											onClick={() => navigate(`/${user.username}`)}
											_hover={{ opacity: 0.8 }}
										>
											<Avatar size="sm" name={user.name} />
											<Box>
												<Text
													fontSize="sm"
													fontWeight="medium"
													color={textColor}
													noOfLines={1}
												>
													{user.name}
												</Text>
												<Text fontSize="xs" color={mutedText}>
													@{user.username}
												</Text>
											</Box>
										</HStack>
										<Button
											size="xs"
											colorScheme="purple"
											variant="outline"
											borderRadius="3xl"
											isLoading={followingUsers[user._id]}
											onClick={() => handleFollow(user._id)}
											_hover={{ bg: "purple.500", color: "white" }}
										>
											Follow
										</Button>
									</Flex>
								</Box>
							))}
						</VStack>
					)}
				</Box>
			</VStack>
		</Box>
	);
};

export default LeftSidebar;
