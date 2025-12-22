import { atom } from "recoil";

const notificationsAtom = atom({
	key: "notificationsAtom",
	default: {
		notifications: [],
		unreadCount: 0,
		isLoading: false,
	},
});

export default notificationsAtom;
