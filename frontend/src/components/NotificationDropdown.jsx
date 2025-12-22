import {
	Box,
	Flex,
	IconButton,
	Popover,
	PopoverTrigger,
	PopoverContent,
	PopoverHeader,
	PopoverBody,
	PopoverArrow,
	Text,
	VStack,
	HStack,
	Badge,
	Button,
	Spinner,
	useColorModeValue,
	Divider,
} from "@chakra-ui/react";
import { FiBell, FiCheck, FiTrash2, FiUser, FiMessageCircle, FiThumbsUp, FiHeart } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import useNotifications from "../hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const NotificationDropdown = () => {
	const {
		notifications,
		unreadCount,
		isLoading,
		fetchNotifications,
		fetchUnreadCount,
		markAsRead,
		markAllAsRead,
		deleteNotification,
	} = useNotifications();

	const navigate = useNavigate();
	
	const bgColor = useColorModeValue("white", "#1a1a1a");
	const borderColor = useColorModeValue("gray.200", "rgba(255,255,255,0.1)");
	const hoverBg = useColorModeValue("gray.50", "rgba(255,255,255,0.08)");
	const unreadBg = useColorModeValue("purple.50", "rgba(128, 90, 213, 0.15)");
	const textColor = useColorModeValue("gray.800", "white");
	const mutedText = useColorModeValue("gray.500", "gray.400");

	// Fetch unread count on mount and periodically
	useEffect(() => {
		fetchUnreadCount();
		const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
		return () => clearInterval(interval);
	}, [fetchUnreadCount]);

	const getNotificationIcon = (type) => {
		switch (type) {
			case "follow":
				return <FiUser size={16} />;
			case "comment":
			case "reply":
				return <FiMessageCircle size={16} />;
			case "upvote":
				return <FiThumbsUp size={16} />;
			case "reaction":
				return <FiHeart size={16} />;
			default:
				return <FiBell size={16} />;
		}
	};

	const getNotificationColor = (type) => {
		switch (type) {
			case "follow":
				return "blue.400";
			case "comment":
			case "reply":
				return "green.400";
			case "upvote":
				return "orange.400";
			case "reaction":
				return "pink.400";
			default:
				return "purple.400";
		}
	};

	const handleNotificationClick = async (notification) => {
		if (!notification.read) {
			await markAsRead(notification._id);
		}

		// Navigate based on notification type
		if (notification.type === "follow") {
			navigate(`/${notification.sender?.username}`);
		} else if (notification.debate) {
			navigate(`/debate/${notification.debate._id || notification.debate}`);
		}
	};

	const formatTime = (date) => {
		try {
			return formatDistanceToNow(new Date(date), { addSuffix: true });
		} catch {
			return "";
		}
	};

	return (
		<Popover placement="bottom-end" onOpen={fetchNotifications}>
			<PopoverTrigger>
				<Box position="relative">
					<IconButton
						icon={<FiBell size={20} />}
						variant="ghost"
						aria-label="Notifications"
						size="sm"
						color={mutedText}
						_hover={{ color: textColor }}
					/>
					{unreadCount > 0 && (
						<Badge
							position="absolute"
							top="-2px"
							right="-2px"
							colorScheme="red"
							borderRadius="full"
							fontSize="xs"
							minW="18px"
							h="18px"
							display="flex"
							alignItems="center"
							justifyContent="center"
						>
							{unreadCount > 99 ? "99+" : unreadCount}
						</Badge>
					)}
				</Box>
			</PopoverTrigger>

			<PopoverContent
				bg={bgColor}
				borderColor={borderColor}
				w="360px"
				maxH="480px"
				boxShadow="xl"
				_focus={{ outline: "none" }}
			>
				<PopoverArrow bg={bgColor} />
				<PopoverHeader
					borderBottomWidth="1px"
					fontWeight="semibold"
					py={3}
				>
					<Flex justify="space-between" align="center">
						<Text>Notifications</Text>
						{unreadCount > 0 && (
							<Button
								size="xs"
								variant="ghost"
								colorScheme="purple"
								leftIcon={<FiCheck size={12} />}
								onClick={(e) => {
									e.stopPropagation();
									markAllAsRead();
								}}
							>
								Mark all read
							</Button>
						)}
					</Flex>
				</PopoverHeader>

				<PopoverBody p={0} overflowY="auto" maxH="400px">
					{isLoading ? (
						<Flex justify="center" py={8}>
							<Spinner size="md" color="purple.500" />
						</Flex>
					) : notifications.length === 0 ? (
						<Flex
							direction="column"
							align="center"
							justify="center"
							py={8}
							color={mutedText}
						>
							<FiBell size={32} />
							<Text mt={2} fontSize="sm">
								No notifications yet
							</Text>
						</Flex> 
					) : (
						<VStack spacing={0} align="stretch">
							{notifications.map((notification, index) => (
								<Box key={notification._id}>
									<Flex
										px={4}
										py={3}
										cursor="pointer"
										bg={notification.read ? "transparent" : unreadBg}
										_hover={{ bg: hoverBg }}
										onClick={() => handleNotificationClick(notification)}
										align="flex-start"
										gap={3}
									>
										<Flex
											w="32px"
											h="32px"
											borderRadius="full"
											bg={getNotificationColor(notification.type)}
											color="white"
											align="center"
											justify="center"
											flexShrink={0}
											mt={0.5}
										>
											{getNotificationIcon(notification.type)}
										</Flex>

										<Box flex={1} minW={0}>
											<Text
												fontSize="sm"
												color={textColor}
												noOfLines={2}
												fontWeight={notification.read ? "normal" : "medium"}
											>
												{notification.message}
											</Text>
											{notification.debate?.title && (
												<Text
													fontSize="xs"
													color="purple.400"
													noOfLines={1}
													mt={0.5}
												>
													{notification.debate.title}
												</Text>
											)}
											<Text fontSize="xs" color={mutedText} mt={1}>
												{formatTime(notification.createdAt)}
											</Text>
										</Box>

										<IconButton
											icon={<FiTrash2 size={14} />}
											variant="ghost"
											size="xs"
											color={mutedText}
											_hover={{ color: "red.400" }}
											onClick={(e) => {
												e.stopPropagation();
												deleteNotification(notification._id);
											}}
											aria-label="Delete notification"
										/>
									</Flex>
									{index < notifications.length - 1 && (
										<Divider borderColor={borderColor} />
									)}
								</Box>
							))}
						</VStack>
					)}
				</PopoverBody>
			</PopoverContent>
		</Popover>
	);
};

export default NotificationDropdown;
