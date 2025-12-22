import {
	Box,
	Container,
	Flex,
	Text,
	VStack,
	HStack,
	Button,
	Spinner,
	Badge,
	Select,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import useShowToast from "../hooks/useShowToast";

const MotionArchivePage = () => {
	const showToast = useShowToast();
	const [motions, setMotions] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [filters, setFilters] = useState({ format: "", category: "" });

	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	useEffect(() => {
		const fetchArchive = async () => {
			setIsLoading(true);
			try {
				const params = new URLSearchParams({
					page: page.toString(),
					limit: "20",
				});
				if (filters.format) params.append("format", filters.format);
				if (filters.category) params.append("category", filters.category);

				const res = await fetch(`/api/motions/archive?${params}`);
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);

				setMotions(data.motions);
				setTotalPages(data.totalPages);
			} catch (error) {
				showToast("Error", error.message, "error");
			} finally {
				setIsLoading(false);
			}
		};

		fetchArchive();
	}, [page, filters, showToast]);

	const handleFilterChange = (e) => {
		const { name, value } = e.target;
		setFilters((prev) => ({ ...prev, [name]: value }));
		setPage(1);
	};

	const getRoundLabel = (motion) => {
		if (motion.roundType === "preliminary") {
			return `Round ${motion.round}`;
		}
		const labels = {
			octo: "Octo-finals",
			quarterfinal: "Quarter-finals",
			semifinal: "Semi-finals",
			final: "Grand Final",
		};
		return labels[motion.roundType] || motion.roundType;
	};

	return (
		<Container maxW="container.md" py={8}>
			{/* Header */}
			<VStack align="stretch" spacing={6} mb={8}>
				<Text fontSize="2xl" fontWeight="bold" color={textColor}>
					Motion Archive
				</Text>
				<Text color={mutedText}>
					Browse motions from past tournaments for practice and learning.
				</Text>

				{/* Filters */}
				<HStack spacing={3}>
					<Select
						name="format"
						value={filters.format}
						onChange={handleFilterChange}
						placeholder="All formats"
						size="sm"
						borderRadius="full"
						borderColor={borderColor}
						maxW="150px"
					>
						<option value="BP">BP</option>
						<option value="AP">AP</option>
					</Select>
					<Select
						name="category"
						value={filters.category}
						onChange={handleFilterChange}
						placeholder="All categories"
						size="sm"
						borderRadius="full"
						borderColor={borderColor}
						maxW="150px"
					>
						<option value="school">School</option>
						<option value="college">College</option>
						<option value="open">Open</option>
						<option value="novice">Novice</option>
					</Select>
				</HStack>
			</VStack>

			{/* Motion list */}
			{isLoading ? (
				<Flex justify="center" py={8}>
					<Spinner />
				</Flex>
			) : motions.length === 0 ? (
				<Box
					py={8}
					textAlign="center"
					border="1px dashed"
					borderColor={borderColor}
					borderRadius="3xl"
				>
					<Text color={mutedText}>No archived motions found.</Text>
				</Box>
			) : (
				<VStack spacing={4} align="stretch">
					{motions.map((motion, index) => (
						<Box
							key={index}
							bg={cardBg}
							border="1px"
							borderColor={borderColor}
							borderRadius="3xl"
							p={5}
						>
							{/* Motion header */}
							<Flex justify="space-between" align="center" mb={3}>
								<HStack spacing={2}>
									<Text fontWeight="semibold" fontSize="sm" color={textColor}>
										{motion.tournamentName}
									</Text>
									<Badge borderRadius="full" px={2}>
										{motion.tournamentFormat}
									</Badge>
									<Badge colorScheme="purple" borderRadius="full" px={2}>
										{motion.tournamentCategory}
									</Badge>
								</HStack>
								<Text fontSize="xs" color={mutedText}>
									{getRoundLabel(motion)}
								</Text>
							</Flex>

							{/* Motion text */}
							<Text color={textColor} mb={3}>
								{motion.motionText}
							</Text>

							{/* Info slide */}
							{motion.infoSlide && (
								<Box
									p={3}
									bg={useColorModeValue("gray.50", "#1a1a1a")}
									borderRadius="xl"
									mb={3}
								>
									<Text fontSize="sm" color={mutedText}>
										{motion.infoSlide}
									</Text>
								</Box>
							)}

							{/* Archived time */}
							<Text fontSize="xs" color={mutedText}>
								Archived {formatDistanceToNowStrict(new Date(motion.archivedAt))} ago
							</Text>
						</Box>
					))}

					{/* Pagination */}
					{totalPages > 1 && (
						<HStack justify="center" spacing={2} pt={4}>
							<Button
								size="sm"
								borderRadius="full"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								isDisabled={page === 1}
							>
								Previous
							</Button>
							<Text color={mutedText} fontSize="sm">
								Page {page} of {totalPages}
							</Text>
							<Button
								size="sm"
								borderRadius="full"
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								isDisabled={page === totalPages}
							>
								Next
							</Button>
						</HStack>
					)}
				</VStack>
			)}
		</Container>
	);
};

export default MotionArchivePage;
