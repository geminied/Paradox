import { Button, Flex, Link, Tooltip, Box, Text, useColorModeValue } from "@chakra-ui/react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { RxAvatar } from "react-icons/rx";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import useLogout from "../hooks/useLogout";
import authScreenAtom from "../atoms/authAtom";

const Header = () => {
	const user = useRecoilValue(userAtom);
	const logout = useLogout();
	const setAuthScreen = useSetRecoilState(authScreenAtom);
	const location = useLocation();

	const borderColor = useColorModeValue("gray.200", "#333333");
	const textColor = useColorModeValue("gray.900", "white");
	const mutedText = useColorModeValue("gray.500", "#888888");

	const isDebateDetailPage = location.pathname.startsWith("/debate/");
	const isDebatesActive = location.pathname === "/" || isDebateDetailPage;
	const isCompetitionsActive = location.pathname === "/competitions";
	
	// Only show tabs on home page and competitions page
	const showTabs = location.pathname === "/" || location.pathname === "/competitions";

	// Hide header on debate detail page
	if (isDebateDetailPage) {
		return null;
	}

	return (
		<Flex direction="column" mt={6} mb="8">
			{/* Top bar with auth/profile */}
			<Flex justifyContent="space-between" mb={4}>
				{!user && (
					<Link as={RouterLink} to={"/auth"} onClick={() => setAuthScreen("login")}>
						Login
					</Link>
				)}
				
				{user && <Box />}

				{user && (
					<Flex alignItems={"center"} gap={4}>
						<Tooltip label="Profile" hasArrow>
							<Link as={RouterLink} to={`/${user.username}`}>
								<RxAvatar size={24} />
							</Link>
						</Tooltip>
						<Tooltip label="Logout" hasArrow>
							<Button size={"xs"} onClick={logout}>
								<FiLogOut size={20} />
							</Button>
						</Tooltip>
					</Flex>
				)}

				{!user && (
					<Link as={RouterLink} to={"/auth"} onClick={() => setAuthScreen("signup")}>
						Sign up
					</Link>
				)}
			</Flex>

			{/* Tab Navigation - Only show on home and competitions pages */}
			{user && showTabs && (
				<Flex
					borderBottom="1px"
					borderColor={borderColor}
				>
					<Link
						as={RouterLink}
						to="/"
						flex={1}
						textAlign="center"
						py={3}
						fontWeight="semibold"
						fontSize="sm"
						color={isDebatesActive ? textColor : mutedText}
						borderBottom="2px"
						borderColor={isDebatesActive ? textColor : "transparent"}
						_hover={{ textDecoration: "none", color: textColor }}
						transition="all 0.15s"
					>
						Debates
					</Link>
					<Link
						as={RouterLink}
						to="/competitions"
						flex={1}
						textAlign="center"
						py={3}
						fontWeight="semibold"
						fontSize="sm"
						color={isCompetitionsActive ? textColor : mutedText}
						borderBottom="2px"
						borderColor={isCompetitionsActive ? textColor : "transparent"}
						_hover={{ textDecoration: "none", color: textColor }}
						transition="all 0.15s"
					>
						Competitions
					</Link>
				</Flex>
			)}
		</Flex>
	);
};

export default Header;