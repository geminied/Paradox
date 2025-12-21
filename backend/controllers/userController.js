import User from "../models/userModel.js";
import Debate from "../models/debateModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import mongoose from "mongoose";

const getUserProfile = async (req, res) => {
	// We will fetch user profile either with username or userId
	// query is either username or userId
	const { query } = req.params;

	try {
		let user;

		// query is userId
		if (mongoose.Types.ObjectId.isValid(query)) {
			user = await User.findOne({ _id: query }).select("-password").select("-updatedAt");
		} else {
			// query is username
			user = await User.findOne({ username: query }).select("-password").select("-updatedAt");
		}

		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in getUserProfile: ", err.message);
	}
};

const signupUser = async (req, res) => {
	try {
		const { name, email, username, password } = req.body;
		const user = await User.findOne({ $or: [{ email }, { username }] });

		if (user) {
			return res.status(400).json({ error: "User already exists" });
		}
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			name,
			email,
			username,
			password: hashedPassword,
		});
		await newUser.save();

		if (newUser) {
			generateTokenAndSetCookie(newUser._id, res);

			res.status(201).json({
				_id: newUser._id,
				name: newUser.name,
				email: newUser.email,
				username: newUser.username,
				bio: newUser.bio,
				profilePic: newUser.profilePic,
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in signupUser: ", err.message);
	}
};

const loginUser = async (req, res) => {
	try {
		const { email, password} = req.body;
		const user = await User.findOne({ email });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");
		console.log(isPasswordCorrect);

		if (!user || !isPasswordCorrect) return res.status(400).json({ error: "Invalid username or password" });

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
			bio: user.bio,
			profilePic: user.profilePic,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in loginUser: ", error.message);
	}
};

const logoutUser = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 1 });
		res.status(200).json({ message: "User logged out successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in signupUser: ", err.message);
	}
};

const updateUser = async (req, res) => {
	const { name, email, username, password, bio } = req.body;

	const userId = req.user._id;
	try {
		let user = await User.findById(userId);
		if (!user) return res.status(400).json({ error: "User not found" });

		if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "You cannot update other user's profile" });

		if (password) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			user.password = hashedPassword;
		}

		user.name = name || user.name;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;

		user = await user.save();

		// password should be null in response
		user.password = null;

		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in updateUser: ", err.message);
	}
};

// Follow/Unfollow user
const followUnfollowUser = async (req, res) => {
	try {
		const { id } = req.params;
		const currentUserId = req.user._id;

		if (id === currentUserId.toString()) {
			return res.status(400).json({ error: "You cannot follow yourself" });
		}

		const userToFollow = await User.findById(id);
		const currentUser = await User.findById(currentUserId);

		if (!userToFollow) {
			return res.status(404).json({ error: "User not found" });
		}

		const isFollowing = currentUser.following.includes(id);

		if (isFollowing) {
			// Unfollow
			await User.findByIdAndUpdate(currentUserId, { $pull: { following: id } });
			await User.findByIdAndUpdate(id, { $pull: { followers: currentUserId } });
			res.status(200).json({ message: "Unfollowed successfully", isFollowing: false });
		} else {
			// Follow
			await User.findByIdAndUpdate(currentUserId, { $push: { following: id } });
			await User.findByIdAndUpdate(id, { $push: { followers: currentUserId } });
			res.status(200).json({ message: "Followed successfully", isFollowing: true });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in followUnfollowUser: ", err.message);
	}
};

// Get following feed (debates from users you follow)
const getFollowingFeed = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const following = user.following;

		if (following.length === 0) {
			return res.status(200).json([]);
		}

		const debates = await Debate.find({ author: { $in: following } })
			.populate("author", "name username")
			.sort({ createdAt: -1 });

		res.status(200).json(debates);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in getFollowingFeed: ", err.message);
	}
};

// Get suggested users to follow
const getSuggestedUsers = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);

		// Get users that current user is not following (excluding self)
		const suggestedUsers = await User.find({
			_id: { $nin: [...user.following, userId] },
		})
			.select("name username bio followers")
			.limit(5)
			.sort({ createdAt: -1 });

		// Add follower count to response
		const usersWithStats = suggestedUsers.map((u) => ({
			_id: u._id,
			name: u.name,
			username: u.username,
			bio: u.bio,
			followersCount: u.followers?.length || 0,
		}));

		res.status(200).json(usersWithStats);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in getSuggestedUsers: ", err.message);
	}
};

export { signupUser, loginUser, logoutUser, updateUser, getUserProfile, followUnfollowUser, getFollowingFeed, getSuggestedUsers };
