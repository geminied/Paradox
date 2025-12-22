import {
	Box,
	Flex,
	Text,
	VStack,
	HStack,
	Badge,
	Avatar,
	AvatarGroup,
	useColorModeValue,
	Button,
	IconButton,
} from "@chakra-ui/react";
import { FiUsers, FiAward, FiTrendingUp } from "react-icons/fi";

const TeamCard = ({ team, onView }) => {
	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const hoverBg = useColorModeValue("gray.50", "#1a1a1a");

	const getStatusColor = (status) => {
		switch (status) {
			case "active":
				return "green";
			case "withdrawn":
				return "gray";
			case "disqualified":
				return "red";
			default:
				return "gray";
		}
	};

	return (
		<Box
			bg={cardBg}
			border="1px"
			borderColor={borderColor}
			borderRadius="3xl"
			p={4}
			cursor="pointer"
			transition="all 0.15s"
			_hover={{ bg: hoverBg }}
			onClick={onView}
		>
			<VStack align="stretch" spacing={3}>
				{/* Header */}
				<HStack justify="space-between">
					<HStack>
						<FiUsers size={20} />
						<Text fontWeight="bold" fontSize="lg" color={textColor}>
							{team.name}
						</Text>
					</HStack>
					<Badge
						colorScheme={getStatusColor(team.status)}
						variant="subtle"
						fontSize="xs"
						borderRadius="full"
						px={2}
					>
						{team.status}
					</Badge>
				</HStack>

				{/* Institution */}
				<Text fontSize="sm" color={mutedText}>
					{team.institution}
				</Text>

				{/* Stats */}
				<HStack spacing={4}>
					<HStack>
						<FiAward size={16} color={mutedText} />
						<Text fontSize="sm" color={textColor} fontWeight="semibold">
							{team.totalPoints || 0} pts
						</Text>
					</HStack>
					<HStack>
						<FiTrendingUp size={16} color={mutedText} />
						<Text fontSize="sm" color={textColor} fontWeight="semibold">
							{team.totalSpeaks || 0} speaks
						</Text>
					</HStack>
				</HStack>

				{/* Members */}
				<HStack justify="space-between">
					<Text fontSize="xs" color={mutedText}>
						{team.members?.length || 0} members
					</Text>
					<AvatarGroup size="sm" max={3}>
						{team.members?.map((member, idx) => (
							<Avatar key={idx} name={member.name || `Member ${idx + 1}`} size="sm" />
						))}
					</AvatarGroup>
				</HStack>
			</VStack>
		</Box>
	);
};

export default TeamCard;
