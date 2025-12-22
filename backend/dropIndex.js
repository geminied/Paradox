import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dropProblematicIndex = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("Connected to MongoDB");

		const db = mongoose.connection.db;
		const collection = db.collection("teams");

		// List all indexes
		const indexes = await collection.indexes();
		console.log("Current indexes:", indexes);

		// Drop the problematic index
		try {
			await collection.dropIndex("tournament_1_teamName_1");
			console.log("✓ Dropped tournament_1_teamName_1 index");
		} catch (err) {
			console.log("Index does not exist:", err.message);
		}

		await mongoose.connection.close();
		console.log("Done!");
		process.exit(0);
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
};

dropProblematicIndex();
