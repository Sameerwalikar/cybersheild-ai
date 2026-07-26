import { app } from "./app.js";
import { env, connectDatabase, disconnectDatabase } from "./config/index.js";
import { initSocket } from "./config/socket.js";
import { initAI } from "./modules/ai/index.js";
import { initPipeline } from "./services/infrastructure.pipeline.js";
import http from "http";

async function main() {
  await connectDatabase();
  await initAI();
  await initPipeline();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.PORT, () => {
    console.log(`🚀 CyberShield API running on port ${env.PORT}`);
    console.log(`📍 Health: http://localhost:${env.PORT}/api/v1/health`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log("👋 Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
