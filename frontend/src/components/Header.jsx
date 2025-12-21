import { Flex, Link, Tooltip, Box, Text, useColorModeValue, IconButton, HStack } from "@chakra-ui/react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { RxAvatar } from "react-icons/rx";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiBookmark } from "react-icons/fi";
import useLogout from "../hooks/useLogout";
import authScreenAtom from "../atoms/authAtom";

const Header = ({ activeTab, onTabChange }) => {
	const user = useRecoilValue(userAtom);
	const logout = useLogout();
	const setAuthScreen = useSetRecoilState(authScreenAtom);
	const location = useLocation();
	const navigate = useNavigate();

	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "gray.400");
	const pillBg = useColorModeValue("gray.100", "rgba(255,255,255,0.08)");
	const pillActiveBg = useColorModeValue("white", "rgba(255,255,255,0.15)");
	const navContainerBg = useColorModeValue("gray.200", "rgba(255,255,255,0.05)");

	const isDebateDetailPage = location.pathname.startsWith("/debate/");
	const isHomePage = location.pathname === "/";
	const isCompetitionsPage = location.pathname === "/competitions";

	// Hide header on debate detail page
	if (isDebateDetailPage) {
		return null;
	}

	const handleTabClick = (tabIndex) => {
		if (!isHomePage) {
			navigate("/");
		}
		onTabChange && onTabChange(tabIndex);
	};

	// Determine which tab is active
	const getActiveIndex = () => {
		if (isCompetitionsPage) return 2;
		if (isHomePage) return activeTab;
		return 0;
	};

	const currentActiveIndex = getActiveIndex();

	return (
		<Box pt={6} pb={4}>
			<Flex 
				justify="space-between" 
				align="center"
			>
				{/* Logo */}
				<Link 
					as={RouterLink} 
					to="/" 
					_hover={{ textDecoration: "none", opacity: 0.8 }}
					onClick={() => onTabChange && onTabChange(0)}
					flexShrink={0}
				>
					<Text 
						fontSize="xl" 
						fontWeight="bold" 
						bgGradient="linear(to-r, purple.400, purple.600)"
						bgClip="text"
						letterSpacing="-0.5px"
					>
						Paradox
					</Text>
				</Link>

				{/* Center Navigation - Pill Style */}
				{user && (isHomePage || isCompetitionsPage) && (
					<HStack
						bg={navContainerBg}
						borderRadius="full"
						p="4px"
						spacing={1}
					>
						<Box
							as="button"
							px={4}
							py={2}
							borderRadius="full"
							fontSize="sm"
							fontWeight="medium"
							bg={currentActiveIndex === 0 ? pillActiveBg : "transparent"}
							color={currentActiveIndex === 0 ? textColor : mutedText}
							boxShadow={currentActiveIndex === 0 ? "sm" : "none"}
							transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
							_hover={{ color: textColor }}
							onClick={() => handleTabClick(0)}
						>
							For You
						</Box>
						<Box
							as="button"
							px={4}
							py={2}
							borderRadius="full"
							fontSize="sm"
							fontWeight="medium"
							bg={currentActiveIndex === 1 ? pillActiveBg : "transparent"}
							color={currentActiveIndex === 1 ? textColor : mutedText}
							boxShadow={currentActiveIndex === 1 ? "sm" : "none"}
							transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
							_hover={{ color: textColor }}
							onClick={() => handleTabClick(1)}
						>
							Following
						</Box>
						<Box
							as={RouterLink}
							to="/competitions"
							px={4}
							py={2}
							borderRadius="full"
							fontSize="sm"
							fontWeight="medium"
							bg={currentActiveIndex === 2 ? pillActiveBg : "transparent"}
							color={currentActiveIndex === 2 ? textColor : mutedText}
							boxShadow={currentActiveIndex === 2 ? "sm" : "none"}
							transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
							_hover={{ textDecoration: "none", color: textColor }}
						>
							Compete
						</Box>
					</HStack>
				)}

				{/* Right side - Auth or Profile */}
				<Flex align="center" gap={2} flexShrink={0}>
					{!user && (
						<Flex gap={4}>
							<Link 
								as={RouterLink} 
								to="/auth" 
								onClick={() => setAuthScreen("login")}
								fontSize="sm"
								color={mutedText}
								_hover={{ color: textColor, textDecoration: "none" }}
							>
								Login
							</Link>
							<Link 
								as={RouterLink} 
								to="/auth" 
								onClick={() => setAuthScreen("signup")}
								fontSize="sm"
								fontWeight="medium"
								color="purple.400"
								_hover={{ color: "purple.300", textDecoration: "none" }}
							>
								Sign up
							</Link>
						</Flex>
					)}

					{user && (
						<HStack spacing={1}>
							<Tooltip label="Saved Debates" hasArrow>
								<IconButton
									as={RouterLink}
									to="/saved"
									icon={<FiBookmark size={18} />}
									variant="ghost"
									size="sm"
									aria-label="Saved Debates"
									color={mutedText}
									borderRadius="full"
									_hover={{ color: textColor, bg: pillBg }}
								/>
							</Tooltip>
							<Tooltip label="Profile" hasArrow>
								<IconButton
									as={RouterLink}
									to={`/${user.username}`}
									icon={<RxAvatar size={20} />}
									variant="ghost"
									size="sm"
									aria-label="Profile"
									color={mutedText}
									borderRadius="full"
									_hover={{ color: textColor, bg: pillBg }}
								/>
							</Tooltip>
							<Tooltip label="Logout" hasArrow>
								<IconButton
									icon={<FiLogOut size={18} />}
									variant="ghost"
									size="sm"
									onClick={logout}
									aria-label="Logout"
									color={mutedText}
									borderRadius="full"
									_hover={{ color: textColor, bg: pillBg }}
								/>
							</Tooltip>
						</HStack>
					)}
				</Flex>
			</Flex>
		</Box>
	);
};

export default Header;