import Debate from "../models/debateModel.js";
import Category from "../models/categoryModel.js";
import User from "../models/userModel.js";
import Comment from "../models/commentModel.js";

// Create a new debate
const createDebate = async (req, res) => {
	try {
		const { category, title, context } = req.body;
		const userId = req.user._id;

		if (!category || !title) {
			return res.status(400).json({ error: "Category and title are required" });
		}

		// Create or update category
		let existingCategory = await Category.findOne({ 
			name: { $regex: new RegExp(`^${category}$`, "i") } 
		});
		
		if (existingCategory) {
			existingCategory.usageCount += 1;
			await existingCategory.save();
		} else {
			await Category.create({ name: category });
		}

		// Create debate
		const newDebate = new Debate({
			author: userId,
			category,
			title,
			context: context || "",
		});

		await newDebate.save();

		// Populate author info
		await newDebate.populate("author", "name username");

		res.status(201).json(newDebate);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in createDebate: ", error.message);
	}
};

// Get all debates (feed)
const getDebates = async (req, res) => {
	try {
		const debates = await Debate.find()
			.populate("author", "name username")
			.sort({ createdAt: -1 });

		res.status(200).json(debates);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getDebates: ", error.message);
	}
};

// Get single debate
const getDebate = async (req, res) => {
	try {
		const debate = await Debate.findById(req.params.id)
			.populate("author", "name username");

		if (!debate) {
			return res.status(404).json({ error: "Debate not found" });
		}

		res.status(200).json(debate);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getDebate: ", error.message);
	}
};

// Upvote/Downvote debate
const toggleUpvote = async (req, res) => {
	try {
		const debateId = req.params.id;
		const userId = req.user._id;

		const debate = await Debate.findById(debateId);

		if (!debate) {
			return res.status(404).json({ error: "Debate not found" });
		}

		const hasUpvoted = debate.upvotes.includes(userId);

		if (hasUpvoted) {
			// Remove upvote
			debate.upvotes = debate.upvotes.filter(
				(id) => id.toString() !== userId.toString()
			);
		} else {
			// Add upvote
			debate.upvotes.push(userId);
		}

		await debate.save();

		res.status(200).json({ 
			upvotes: debate.upvotes,
			upvotesCount: debate.upvotes.length,
			hasUpvoted: !hasUpvoted 
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in toggleUpvote: ", error.message);
	}
};

// Search categories (for autocomplete)
const searchCategories = async (req, res) => {
	try {
		const { q } = req.query;
		
		let categories;
		if (q) {
			categories = await Category.find({
				name: { $regex: q, $options: "i" }
			})
			.sort({ usageCount: -1 })
			.limit(10);
		} else {
			// Return popular categories
			categories = await Category.find()
				.sort({ usageCount: -1 })
				.limit(10);
		}

		res.status(200).json(categories);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in searchCategories: ", error.message);
	}
};

// Delete debate
const deleteDebate = async (req, res) => {
	try {
		const debate = await Debate.findById(req.params.id);

		if (!debate) {
			return res.status(404).json({ error: "Debate not found" });
		}

		if (debate.author.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to delete this debate" });
		}

		await Debate.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Debate deleted successfully" });
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in deleteDebate: ", error.message);
	}
};

// Get hot topics (combination of upvotes, comments, and recency)
const getHotTopics = async (req, res) => {
	try {
		const debates = await Debate.find()
			.populate("author", "name username")
			.lean();

		// Calculate hot score for each debate
		// Score = (upvotes * 2) + (comments * 3) + recency bonus
		const now = new Date();
		const scoredDebates = debates.map((debate) => {
			const ageInHours = (now - new Date(debate.createdAt)) / (1000 * 60 * 60);
			const recencyBonus = Math.max(0, 48 - ageInHours) * 0.5; // Bonus for debates < 48 hours old
			
			const hotScore = 
				(debate.upvotes?.length || 0) * 2 + 
				(debate.commentsCount || 0) * 3 + 
				recencyBonus;

			return { ...debate, hotScore };
		});

		// Sort by hot score and take top 5
		const hotTopics = scoredDebates
			.sort((a, b) => b.hotScore - a.hotScore)
			.slice(0, 5);

		res.status(200).json(hotTopics);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getHotTopics: ", error.message);
	}
};

// Get suggested debates for user (based on categories they engage with)
const getSuggestedDebates = async (req, res) => {
	try {
		const userId = req.user?._id;

		if (!userId) {
			// If not logged in, return random popular debates
			const debates = await Debate.find()
				.populate("author", "name username")
				.sort({ "upvotes.length": -1 })
				.limit(5);
			return res.status(200).json(debates);
		}

		// Get categories the user has engaged with (commented or created debates)
		const userDebates = await Debate.find({ author: userId }).select("category");
		const userComments = await Comment.find({ author: userId }).populate({
			path: "debate",
			select: "category",
		});

		const engagedCategories = new Set();
		userDebates.forEach((d) => engagedCategories.add(d.category?.toLowerCase()));
		userComments.forEach((c) => {
			if (c.debate?.category) {
				engagedCategories.add(c.debate.category.toLowerCase());
			}
		});

		let suggestions;

		if (engagedCategories.size > 0) {
			// Find debates in categories user engages with, excluding their own
			suggestions = await Debate.find({
				author: { $ne: userId },
				category: { $regex: new RegExp([...engagedCategories].join("|"), "i") },
			})
				.populate("author", "name username")
				.sort({ createdAt: -1 })
				.limit(5);
		}

		// If not enough suggestions, fill with popular debates
		if (!suggestions || suggestions.length < 5) {
			const existingIds = suggestions?.map((d) => d._id) || [];
			const additionalDebates = await Debate.find({
				_id: { $nin: existingIds },
				author: { $ne: userId },
			})
				.populate("author", "name username")
				.sort({ createdAt: -1 })
				.limit(5 - (suggestions?.length || 0));

			suggestions = [...(suggestions || []), ...additionalDebates];
		}

		res.status(200).json(suggestions);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getSuggestedDebates: ", error.message);
	}
};

// Get debates by category (for filtering)
const getDebatesByCategory = async (req, res) => {
	try {
		const { category } = req.params;

		const debates = await Debate.find({
			category: { $regex: new RegExp(`^${category}$`, "i") },
		})
			.populate("author", "name username")
			.sort({ createdAt: -1 });

		res.status(200).json(debates);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in getDebatesByCategory: ", error.message);
	}
};

export { 
	createDebate, 
	getDebates, 
	getDebate, 
	toggleUpvote, 
	searchCategories,
	deleteDebate,
	getHotTopics,
	getSuggestedDebates,
	getDebatesByCategory,
};