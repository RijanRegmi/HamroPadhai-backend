import { connectDatabase } from "./database/mongodb";
import { PORT } from "./config";
import app from "./app";

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start");
    console.error(error);
    process.exit(1);
  }
};

startServer();
