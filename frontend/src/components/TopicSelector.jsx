import {
	Box,
	Input,
	VStack,
	HStack,
	Text,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { FiChevronRight } from "react-icons/fi";

const TopicSelector = ({ value, onChange, placeholder = "Add a topic" }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState(value || "");
	const [categories, setCategories] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const inputRef = useRef(null);
	const dropdownRef = useRef(null);

	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");
	const hoverBg = useColorModeValue("gray.100", "#1a1a1a");
	const dropdownBg = useColorModeValue("white", "#101010");

	// Fetch categories based on search
	useEffect(() => {
		const fetchCategories = async () => {
			setIsLoading(true);
			try {
				const res = await fetch(`/api/debates/categories?q=${searchQuery}`);
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				setCategories(data);
			} catch (error) {
				console.error("Error fetching categories:", error);
				setCategories([]);
			} finally {
				setIsLoading(false);
			}
		};

		const debounce = setTimeout(fetchCategories, 300);
		return () => clearTimeout(debounce);
	}, [searchQuery]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target) &&
				inputRef.current &&
				!inputRef.current.contains(e.target)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = (categoryName) => {
		setSearchQuery(categoryName);
		onChange(categoryName);
		setIsOpen(false);
	};

	const handleInputChange = (e) => {
		const val = e.target.value;
		setSearchQuery(val);
		onChange(val);
		setIsOpen(true);
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && searchQuery.trim()) {
			onChange(searchQuery.trim());
			setIsOpen(false);
		}
	};

	return (
		<Box position="relative">
			<HStack spacing={1} cursor="pointer" onClick={() => inputRef.current?.focus()}>
				<FiChevronRight size={14} color={mutedText} />
				<Input
					ref={inputRef}
					placeholder={placeholder}
					value={searchQuery}
					onChange={handleInputChange}
					onFocus={() => setIsOpen(true)}
					onKeyDown={handleKeyDown}
					variant="unstyled"
					size="sm"
					color={searchQuery ? textColor : mutedText}
					_placeholder={{ color: mutedText }}
					w="auto"
					minW="80px"
					maxW="200px"
				/>
			</HStack>

			{/* Dropdown */}
			{isOpen && (
				<Box
					ref={dropdownRef}
					position="absolute"
					top="100%"
					left={0}
					mt={2}
					bg={dropdownBg}
					border="1px"
					borderColor={borderColor}
					borderRadius="xl"
					boxShadow="lg"
					zIndex={1000}
					minW="200px"
					maxH="300px"
					overflowY="auto"
					py={2}
				>
					{/* Create new option if typing something new */}
					{searchQuery.trim() && !categories.find(c => c.name.toLowerCase() === searchQuery.toLowerCase()) && (
						<HStack
							px={4}
							py={2}
							cursor="pointer"
							_hover={{ bg: hoverBg }}
							onClick={() => handleSelect(searchQuery.trim())}
						>
							<Text fontSize="sm" color={textColor}>
								Create "{searchQuery.trim()}"
							</Text>
						</HStack>
					)}

					{/* Existing categories */}
					{categories.length > 0 ? (
						<VStack align="stretch" spacing={0}>
							{categories.map((cat) => (
								<HStack
									key={cat._id}
									px={4}
									py={2}
									cursor="pointer"
									_hover={{ bg: hoverBg }}
									onClick={() => handleSelect(cat.name)}
								>
									<Text fontSize="sm" color={textColor}>
										{cat.name}
									</Text>
								</HStack>
							))}
						</VStack>
					) : (
						!searchQuery.trim() && (
							<Text fontSize="sm" color={mutedText} px={4} py={2}>
								Start typing to add a topic
							</Text>
						)
					)}
				</Box>
			)}
		</Box>
	);
};

export default TopicSelector;