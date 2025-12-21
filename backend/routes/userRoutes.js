import express from "express";
import {
	getUserProfile,
	loginUser,
	logoutUser,
	signupUser,
	updateUser,
	followUnfollowUser,
	getFollowingFeed,
	getSuggestedUsers,
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/profile/:query", getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.get("/following-feed", protectRoute, getFollowingFeed);
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.put("/update/:id", protectRoute, updateUser);
router.post("/follow/:id", protectRoute, followUnfollowUser);

export default router;
