import {
	Box,
	Flex,
	Text,
	VStack,
	useColorModeValue,
} from "@chakra-ui/react";
import { FiAward } from "react-icons/fi";

const CompetitionsPage = () => {
	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	return (
		<Box>
			<VStack spacing={6} py={10}>
				<Box
					bg={cardBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="xl"
					p={8}
					textAlign="center"
					w="100%"
				>
					<Text fontWeight="bold" fontSize="xl" color={textColor} mb={2}>
						Competitions Coming Soon
					</Text>
					<Text fontSize="sm" color={mutedText} maxW="300px" mx="auto">
						Structured debate tournaments with time limits, judges, and scoring. 
						Compete and earn empathy points!
					</Text>
				</Box>
			</VStack>
		</Box>
	);
};

export default CompetitionsPage;