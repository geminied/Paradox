import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const cleanup = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("Connected to MongoDB");

		const db = mongoose.connection.db;
		const collection = db.collection("teams");

		// Find teams with null name
		const nullNameTeams = await collection.find({ name: null }).toArray();
		console.log(`Found ${nullNameTeams.length} teams with null name:`, nullNameTeams);

		// Delete teams with null name
		if (nullNameTeams.length > 0) {
			const result = await collection.deleteMany({ name: null });
			console.log(`✓ Deleted ${result.deletedCount} teams with null name`);
		}

		await mongoose.connection.close();
		console.log("Done!");
		process.exit(0);
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
};

cleanup();
