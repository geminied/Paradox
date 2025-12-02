import Debate from "../models/debateModel.js";
import Category from "../models/categoryModel.js";
import User from "../models/userModel.js";

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

export { 
	createDebate, 
	getDebates, 
	getDebate, 
	toggleUpvote, 
	searchCategories,
	deleteDebate 
};