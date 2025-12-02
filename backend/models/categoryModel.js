import mongoose from "mongoose";

const categorySchema = mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		usageCount: {
			type: Number,
			default: 1,
		},
	},
	{
		timestamps: true,
	}
);

const Category = mongoose.model("Category", categorySchema);

export default Category;