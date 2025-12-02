import {
	Avatar,
	Box,
	Button,
	Divider,
	Flex,
	FormControl,
	FormLabel,
	Heading,
	Icon,
	Input,
	InputGroup,
	InputLeftElement,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Text,
	Textarea,
	useColorModeValue,
	VStack,
	HStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { 
	FiUser, 
	FiAtSign, 
	FiMail, 
	FiLock, 
	FiCheck,
	FiX,
	FiEdit3,
	FiShield,
} from "react-icons/fi";

export default function UpdateProfilePage() {
	const [user, setUser] = useRecoilState(userAtom);
	const navigate = useNavigate();
	const [inputs, setInputs] = useState({
		name: user.name,
		username: user.username,
		email: user.email,
		bio: user.bio || "",
		password: "",
		confirmPassword: "",
	});
	const [updating, setUpdating] = useState(false);

	const showToast = useShowToast();

	// Threads-like color scheme: black, white, light gray borders
	const bgColor = useColorModeValue("white", "#000000");
	const cardBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("black", "white");
	const mutedText = useColorModeValue("gray.500", "#777777");
	const accentColor = useColorModeValue("black", "white");

	const handleCancel = () => {
		navigate(-1);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (updating) return;

		// Validate password match if changing password
		if (inputs.password && inputs.password !== inputs.confirmPassword) {
			showToast("Error", "Passwords do not match", "error");
			return;
		}

		setUpdating(true);
		try {
			const updateData = {
				name: inputs.name,
				username: inputs.username,
				email: inputs.email,
				bio: inputs.bio,
			};

			// Only include password if it's being changed
			if (inputs.password) {
				updateData.password = inputs.password;
			}

			const res = await fetch(`/api/users/update/${user._id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updateData),
			});
			const data = await res.json();
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}
			showToast("Success", "Profile updated successfully", "success");
			setUser(data);
			localStorage.setItem("user-paradox", JSON.stringify(data));
			setInputs((prev) => ({ ...prev, password: "", confirmPassword: "" }));
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setUpdating(false);
		}
	};

	return (
		<Box maxW="600px" mx="auto" py={8} px={4}>
			{/* Header Section */}
			<Flex align="center" mb={8} gap={4}>
				<VStack align="start" spacing={0}>
					<Heading size="md" color={textColor}>
						Account Settings
					</Heading>
					<Text color={mutedText} fontSize="sm">
						Manage your profile and security
					</Text>
				</VStack>
			</Flex>

			{/* Tabbed Settings Section */}
			<Tabs variant="soft-rounded" colorScheme="gray">
				<TabList mb={4} bg={cardBg} p={2} borderRadius="xl" border="1px" borderColor={borderColor}>
					<Tab _selected={{ bg: textColor, color: bgColor }}>
						<HStack spacing={2}>
							<Icon as={FiEdit3} boxSize={4} />
							<Text>Edit Profile</Text>
						</HStack>
					</Tab>
					<Tab _selected={{ bg: textColor, color: bgColor }}>
						<HStack spacing={2}>
							<Icon as={FiShield} boxSize={4} />
							<Text>Security</Text>
						</HStack>
					</Tab>
				</TabList>

				<TabPanels>
					{/* Edit Profile Tab */}
					<TabPanel p={0}>
						<Box bg={cardBg} p={6} borderRadius="xl" border="1px" borderColor={borderColor}>
							<form onSubmit={handleSubmit}>
								<VStack spacing={5} align="stretch">
									<FormControl>
										<FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
											Full Name
										</FormLabel>
										<InputGroup>
											<InputLeftElement pointerEvents="none">
												<Icon as={FiUser} color={mutedText} />
											</InputLeftElement>
											<Input
												placeholder="John Doe"
												value={inputs.name}
												onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
												bg={bgColor}
												border="1px"
												borderColor={borderColor}
												_hover={{ borderColor: accentColor }}
												_focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
												borderRadius="lg"
											/>
										</InputGroup>
									</FormControl>

									<FormControl>
										<FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
											Username
										</FormLabel>
										<InputGroup>
											<InputLeftElement pointerEvents="none">
												<Icon as={FiAtSign} color={mutedText} />
											</InputLeftElement>
											<Input
												placeholder="johndoe"
												value={inputs.username}
												onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
												bg={bgColor}
												border="1px"
												borderColor={borderColor}
												_hover={{ borderColor: accentColor }}
												_focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
												borderRadius="lg"
											/>
										</InputGroup>
									</FormControl>

									<FormControl>
										<FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
											Email Address
										</FormLabel>
										<InputGroup>
											<InputLeftElement pointerEvents="none">
												<Icon as={FiMail} color={mutedText} />
											</InputLeftElement>
											<Input
												placeholder="your-email@example.com"
												value={inputs.email}
												onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
												type="email"
												bg={bgColor}
												border="1px"
												borderColor={borderColor}
												_hover={{ borderColor: accentColor }}
												_focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
												borderRadius="lg"
											/>
										</InputGroup>
									</FormControl>

									<FormControl>
										<FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
											Bio
										</FormLabel>
										<Textarea
											placeholder="Tell others about yourself..."
											value={inputs.bio}
											onChange={(e) => setInputs({ ...inputs, bio: e.target.value })}
											bg={bgColor}
											border="1px"
											borderColor={borderColor}
											_hover={{ borderColor: accentColor }}
											_focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
											borderRadius="lg"
											rows={3}
											resize="none"
										/>
										<Text fontSize="xs" color={mutedText} mt={1} textAlign="right">
											{inputs.bio?.length || 0}/200 characters
										</Text>
									</FormControl>

									<Flex gap={3} pt={2}>
										<Button
											variant="outline"
											flex={1}
											onClick={handleCancel}
											leftIcon={<Icon as={FiX} />}
											borderColor={borderColor}
											color={textColor}
											_hover={{ bg: useColorModeValue("gray.100", "#1a1a1a") }}
										>
											Cancel
										</Button>
										<Button
											type="submit"
											flex={1}
											bg={textColor}
											color={bgColor}
											leftIcon={<Icon as={FiCheck} />}
											_hover={{ opacity: 0.8 }}
											isLoading={updating}
											loadingText="Saving..."
										>
											Save Changes
										</Button>
									</Flex>
								</VStack>
							</form>
						</Box>
					</TabPanel>

					{/* Security Tab */}
					<TabPanel p={0}>
						<Box bg={cardBg} p={6} borderRadius="xl" border="1px" borderColor={borderColor}>
							<VStack spacing={5} align="stretch">
								<Box>
									<Heading size="sm" mb={1} color={textColor}>Change Password</Heading>
									<Text fontSize="sm" color={mutedText}>
										Update your password to keep your account secure
									</Text>
								</Box>

								<Divider borderColor={borderColor} />

								<form onSubmit={handleSubmit}>
									<VStack spacing={4} align="stretch">
										<FormControl>
											<FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
												New Password
											</FormLabel>
											<InputGroup>
												<InputLeftElement pointerEvents="none">
													<Icon as={FiLock} color={mutedText} />
												</InputLeftElement>
												<Input
													placeholder="Enter new password"
													value={inputs.password}
													onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
													type="password"
													bg={bgColor}
													border="1px"
													borderColor={borderColor}
													_hover={{ borderColor: accentColor }}
													_focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
													borderRadius="lg"
												/>
											</InputGroup>
										</FormControl>

										<FormControl>
											<FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
												Confirm New Password
											</FormLabel>
											<InputGroup>
												<InputLeftElement pointerEvents="none">
													<Icon as={FiLock} color={mutedText} />
												</InputLeftElement>
												<Input
													placeholder="Confirm new password"
													value={inputs.confirmPassword}
													onChange={(e) => setInputs({ ...inputs, confirmPassword: e.target.value })}
													type="password"
													bg={bgColor}
													border="1px"
													borderColor={borderColor}
													_hover={{ borderColor: accentColor }}
													_focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
													borderRadius="lg"
												/>
											</InputGroup>
											{inputs.password && inputs.confirmPassword && (
												<HStack mt={2} spacing={1}>
													<Icon
														as={inputs.password === inputs.confirmPassword ? FiCheck : FiX}
														color={inputs.password === inputs.confirmPassword ? "green.500" : "red.500"}
														boxSize={4}
													/>
													<Text
														fontSize="xs"
														color={inputs.password === inputs.confirmPassword ? "green.500" : "red.500"}
													>
														{inputs.password === inputs.confirmPassword
															? "Passwords match"
															: "Passwords do not match"}
													</Text>
												</HStack>
											)}
										</FormControl>

										<Button
											type="submit"
											bg={textColor}
											color={bgColor}
											leftIcon={<Icon as={FiShield} />}
											_hover={{ opacity: 0.8 }}
											isLoading={updating}
											loadingText="Updating..."
											isDisabled={!inputs.password || inputs.password !== inputs.confirmPassword}
										>
											Update Password
										</Button>
									</VStack>
								</form>
							</VStack>
						</Box>
					</TabPanel>
				</TabPanels>
			</Tabs>
		</Box>
	);
}