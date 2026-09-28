import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io("/", {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

export function joinPoolRoom(poolId) {
  const s = getSocket();
  s.emit("joinPoolRoom", poolId);
  s.emit("pool:join", poolId);
}

export function leavePoolRoom(poolId) {
  const s = getSocket();
  s.emit("leavePoolRoom", poolId);
  s.emit("pool:leave", poolId);
}
