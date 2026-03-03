const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const isProduction = process.env.PRODUCTION === "true";

    const mongoURI = isProduction
      ? process.env.PRODUCTION_SERVER_MONGO_URI
      : process.env.LOCAL_SERVER_MONGO_URI;

    await mongoose.connect(mongoURI);

    console.log("✅ MongoDB Connected");
    return mongoURI;

  } catch (error) {
    console.error("❌ MongoDB Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;