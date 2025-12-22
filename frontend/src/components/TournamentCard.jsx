import {
	Box,
	Flex,
	Text,
	VStack,
	HStack,
	Badge,
	Avatar,
	useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiUsers, FiClock } from "react-icons/fi";
import { format, formatDistanceToNowStrict } from "date-fns";

const TournamentCard = ({ tournament }) => {
	const navigate = useNavigate();

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const hoverBg = useColorModeValue("gray.50", "#1a1a1a");

	const getStatusColor = (status) => {
		switch (status) {
			case "draft":
				return "gray";
			case "registration":
				return "blue";
			case "ongoing":
				return "green";
			case "completed":
				return "purple";
			case "cancelled":
				return "red";
			default:
				return "gray";
		}
	};

	const timeAgo = formatDistanceToNowStrict(new Date(tournament.createdAt), { addSuffix: false });

	const handleClick = () => {
		navigate(`/tournament/${tournament._id}`);
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
			onClick={handleClick}
		>
			{/* Creator info */}
			<HStack spacing={3} mb={3}>
				<Avatar size="sm" name={tournament.creator?.name} />
				<Flex align="center" gap={2} flexWrap="wrap">
					<Text fontWeight="semibold" fontSize="sm" color={textColor}>
						{tournament.creator?.name}
					</Text>
					<Text fontSize="xs" color={mutedText}>
						{timeAgo}
					</Text>
				</Flex>
			</HStack>

			{/* Badges */}
			<HStack spacing={2} mb={2} flexWrap="wrap">
				<Badge colorScheme="purple" variant="subtle" fontSize="xs" borderRadius="full" px={2}>
					{tournament.format}
				</Badge>
				<Badge 
					colorScheme={getStatusColor(tournament.status)} 
					variant="subtle"
					fontSize="xs" 
					borderRadius="full" 
					px={2}
				>
					{tournament.status}
				</Badge>
				<Badge colorScheme="orange" variant="subtle" fontSize="xs" borderRadius="full" px={2}>
					{tournament.category}
				</Badge>
			</HStack>

			{/* Title */}
			<Text fontWeight="bold" fontSize="md" color={textColor} mb={2}>
				{tournament.name}
			</Text>

			{/* Description */}
			{tournament.description && (
				<Text fontSize="sm" color={mutedText} mb={3} noOfLines={2}>
					{tournament.description}
				</Text>
			)}

			{/* Info row */}
			<HStack spacing={4} pt={2} color={mutedText} fontSize="sm">
				<HStack spacing={1}>
					<FiCalendar size={14} />
					<Text>{format(new Date(tournament.startDate), "MMM d")}</Text>
				</HStack>
				<HStack spacing={1}>
					<FiUsers size={14} />
					<Text>{tournament.participants?.length || 0}/{tournament.maxTeams}</Text>
				</HStack>
				<HStack spacing={1}>
					<FiClock size={14} />
					<Text>{tournament.numberOfRounds} rounds</Text>
				</HStack>
			</HStack>
		</Box>
	);
};

export default TournamentCard;
