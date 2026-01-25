// import mongoose from 'mongoose';
// import logger from './src/core/config/logger.js'; 
// import { app } from './src/app.js'; 
// import { mongoURI, port } from './src/core/config/config.js';


// mongoose
//   .connect(mongoURI)
//   .then(() => {
//     logger.info('MongoDB connected');
//     app.listen(port, () => {
//       logger.info(`Server running on port ${port}`);
//     });
//   })
//   .catch((err) => {
//     logger.error('MongoDB connection error:', err);
//   });

// console.log("[mongo] connected to:", {
//   host: mongoose.connection.host,
//   db: mongoose.connection.name,
//   readyState: mongoose.connection.readyState,
// });

import mongoose from "mongoose";
import logger from "./src/core/config/logger.js";
import { app } from "./src/app.js";
import { mongoURI, port } from "./src/core/config/config.js";

async function start() {
  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 8000 });

    logger.info("MongoDB connected");
    logger.info("[mongo] connected to:", {
      host: mongoose.connection.host,
      db: mongoose.connection.name,
      readyState: mongoose.connection.readyState, // 1
    });

    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (err) {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

start();
