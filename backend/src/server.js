import "dotenv/config";
import http from "http";
import app from "./app.js";
import { initializeWebSocket } from "./services/websocket.service.js";
import { startMatchmaker } from "./services/matchmaker/matchmaker.worker.js";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

initializeWebSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // startMatchmaker();
});