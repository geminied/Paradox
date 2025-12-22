import Notification from "../models/notificationModel.js";
import mongoose from "mongoose";

// Get all notifications for the logged-in user
const getNotifications = async (req, res) => {
	try {
		const userId = req.user._id;
		const { page = 1, limit = 20 } = req.query;

		const notifications = await Notification.find({ recipient: userId })
			.populate("sender", "name username")
			.populate("debate", "title")
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(parseInt(limit));

		const totalCount = await Notification.countDocuments({ recipient: userId });
		const unreadCount = await Notification.countDocuments({ 
			recipient: userId, 
			read: false 
		});

		res.status(200).json({
			notifications,
			totalCount,
			unreadCount,
			currentPage: parseInt(page),
			totalPages: Math.ceil(totalCount / limit),
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getNotifications:", error.message);
	}
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
	try {
		const userId = req.user._id;
		
		const unreadCount = await Notification.countDocuments({ 
			recipient: userId, 
			read: false 
		});

		res.status(200).json({ unreadCount });
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getUnreadCount:", error.message);
	}
};

// Mark a notification as read
const markAsRead = async (req, res) => {
	try {
		const { notificationId } = req.params;
		const userId = req.user._id;

		if (!mongoose.Types.ObjectId.isValid(notificationId)) {
			return res.status(400).json({ error: "Invalid notification ID" });
		}

		const notification = await Notification.findOneAndUpdate(
			{ _id: notificationId, recipient: userId },
			{ read: true },
			{ new: true }
		);

		if (!notification) {
			return res.status(404).json({ error: "Notification not found" });
		}

		res.status(200).json({ message: "Notification marked as read", notification });
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in markAsRead:", error.message);
	}
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
	try {
		const userId = req.user._id;

		await Notification.updateMany(
			{ recipient: userId, read: false },
			{ read: true }
		);

		res.status(200).json({ message: "All notifications marked as read" });
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in markAllAsRead:", error.message);
	}
};

// Delete a notification
const deleteNotification = async (req, res) => {
	try {
		const { notificationId } = req.params;
		const userId = req.user._id;

		if (!mongoose.Types.ObjectId.isValid(notificationId)) {
			return res.status(400).json({ error: "Invalid notification ID" });
		}

		const notification = await Notification.findOneAndDelete({
			_id: notificationId,
			recipient: userId,
		});

		if (!notification) {
			return res.status(404).json({ error: "Notification not found" });
		}

		res.status(200).json({ message: "Notification deleted" });
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in deleteNotification:", error.message);
	}
};

// Delete all notifications
const deleteAllNotifications = async (req, res) => {
	try {
		const userId = req.user._id;

		await Notification.deleteMany({ recipient: userId });

		res.status(200).json({ message: "All notifications deleted" });
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in deleteAllNotifications:", error.message);
	}
};

// Helper function to create a notification (used by other controllers)
const createNotification = async ({ recipient, sender, type, debate, comment, message, link }) => {
	try {
		// Don't create notification if sender is the recipient (only if sender exists)
		if (sender && recipient.toString() === sender.toString()) {
			return null;
		}

		const notification = new Notification({
			recipient,
			sender: sender || null,
			type,
			debate,
			comment,
			message,
			link,
		});

		await notification.save();
		return notification;
	} catch (error) {
		console.log("Error creating notification:", error.message);
		return null;
	}
};

export {
	getNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	deleteNotification,
	deleteAllNotifications,
	createNotification,
};
