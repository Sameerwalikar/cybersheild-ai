import { app } from "./app.js";
import { env, connectDatabase, disconnectDatabase } from "./config/index.js";

async function main() {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
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
