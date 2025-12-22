import express from "express";
import {
	getNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	deleteNotification,
	deleteAllNotifications,
} from "../controllers/notificationController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

// All notification routes require authentication
router.get("/", protectRoute, getNotifications);
router.get("/unread-count", protectRoute, getUnreadCount);
router.put("/read/:notificationId", protectRoute, markAsRead);
router.put("/read-all", protectRoute, markAllAsRead);
router.delete("/:notificationId", protectRoute, deleteNotification);
router.delete("/", protectRoute, deleteAllNotifications);

export default router;
