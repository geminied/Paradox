import UserHeader from "../components/UserHeader";
import useShowToast from "../hooks/useShowToast";
import { Flex, Spinner, HStack, Text, useColorModeValue } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import useGetUserProfile from "../hooks/useGetUserProfile";

const UserPage = () => {
	const { user, loading } = useGetUserProfile();
	const navigate = useNavigate();
	
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	if (!user && loading) {
		return (
			<Flex justifyContent={"center"}>
				<Spinner size={"xl"} />
			</Flex>
		);
	}
	if (!user && !loading) return <h1>User not found</h1>;

	return (
		<>
			{/* Back button */}
			<HStack
				spacing={2}
				mb={4}
				cursor="pointer"
				color={mutedText}
				_hover={{ color: textColor }}
				onClick={() => navigate("/")}
				w="fit-content"
			>
				<FiArrowLeft size={18} />
				<Text fontSize="sm" fontWeight="medium">
					Back to Debates
				</Text>
			</HStack>
			
			<UserHeader user={user} />
		</>
	);
};

export default UserPage;