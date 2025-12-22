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
	toggleBookmark,
	getBookmarkedDebates,
	updateJudgeProfile,
	getAvailableJudges,
	searchJudges,
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/profile/:query", getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.get("/following-feed", protectRoute, getFollowingFeed);
router.get("/bookmarks", protectRoute, getBookmarkedDebates);
router.get("/judges", getAvailableJudges);
router.get("/judges/search", searchJudges);
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.put("/update/:id", protectRoute, updateUser);
router.patch("/judge-profile", protectRoute, updateJudgeProfile);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.post("/bookmark/:debateId", protectRoute, toggleBookmark);

export default router;
