const app = require("./app");
const connectDB = require("./config/db");
const configureSession = require("./config/session");
const { autoSeed } = require("./utils/autoSeeder");

const PORT = process.env.PORT || 3000;

(async () => {
  const mongoURI = await connectDB();
  configureSession(app, mongoURI);
  await autoSeed();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();