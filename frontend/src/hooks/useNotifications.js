import { useCallback } from "react";
import { useRecoilState } from "recoil";
import notificationsAtom from "../atoms/notificationAtom";
import useShowToast from "./useShowToast";

const useNotifications = () => {
	const [notificationsState, setNotificationsState] = useRecoilState(notificationsAtom);
	const showToast = useShowToast();

	const fetchNotifications = useCallback(async () => {
		setNotificationsState((prev) => ({ ...prev, isLoading: true }));
		try {
			const res = await fetch("/api/notifications", {
				credentials: "include",
			});
			const data = await res.json();

			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}

			setNotificationsState({
				notifications: data.notifications,
				unreadCount: data.unreadCount,
				isLoading: false,
			});
		} catch (error) {
			showToast("Error", error.message, "error");
			setNotificationsState((prev) => ({ ...prev, isLoading: false }));
		}
	}, [setNotificationsState, showToast]);

	const fetchUnreadCount = useCallback(async () => {
		try {
			const res = await fetch("/api/notifications/unread-count", {
				credentials: "include",
			});
			const data = await res.json();

			if (!data.error) {
				setNotificationsState((prev) => ({
					...prev,
					unreadCount: data.unreadCount,
				}));
			}
		} catch (error) {
			console.error("Error fetching unread count:", error);
		}
	}, [setNotificationsState]);

	const markAsRead = useCallback(
		async (notificationId) => {
			try {
				const res = await fetch(`/api/notifications/read/${notificationId}`, {
					method: "PUT",
					credentials: "include",
				});
				const data = await res.json();

				if (data.error) {
					showToast("Error", data.error, "error");
					return;
				}

				setNotificationsState((prev) => ({
					...prev,
					notifications: prev.notifications.map((n) =>
						n._id === notificationId ? { ...n, read: true } : n
					),
					unreadCount: Math.max(0, prev.unreadCount - 1),
				}));
			} catch (error) {
				showToast("Error", error.message, "error");
			}
		},
		[setNotificationsState, showToast]
	);

	const markAllAsRead = useCallback(async () => {
		try {
			const res = await fetch("/api/notifications/read-all", {
				method: "PUT",
				credentials: "include",
			});
			const data = await res.json();

			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}

			setNotificationsState((prev) => ({
				...prev,
				notifications: prev.notifications.map((n) => ({ ...n, read: true })),
				unreadCount: 0,
			}));
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	}, [setNotificationsState, showToast]);

	const deleteNotification = useCallback(
		async (notificationId) => {
			try {
				const res = await fetch(`/api/notifications/${notificationId}`, {
					method: "DELETE",
					credentials: "include",
				});
				const data = await res.json();

				if (data.error) {
					showToast("Error", data.error, "error");
					return;
				}

				setNotificationsState((prev) => {
					const notification = prev.notifications.find((n) => n._id === notificationId);
					return {
						...prev,
						notifications: prev.notifications.filter((n) => n._id !== notificationId),
						unreadCount: notification && !notification.read 
							? Math.max(0, prev.unreadCount - 1) 
							: prev.unreadCount,
					};
				});
			} catch (error) {
				showToast("Error", error.message, "error");
			}
		},
		[setNotificationsState, showToast]
	);

	return {
		...notificationsState,
		fetchNotifications,
		fetchUnreadCount,
		markAsRead,
		markAllAsRead,
		deleteNotification,
	};
};

export default useNotifications;
