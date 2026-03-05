import { io, Socket } from "socket.io-client";
import { Config } from "@/src/config";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(Config.WS_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// ─── Room helpers ────────────────────────────────────────────────────
export function joinBranch(tenantId: string, branchId: string) {
  getSocket().emit("joinBranch", { tenantId, branchId });
}

export function leaveBranch(tenantId: string, branchId: string) {
  getSocket().emit("leaveBranch", { tenantId, branchId });
}

export function joinQueue(tenantId: string, branchId: string, queueId: string) {
  getSocket().emit("joinQueue", { tenantId, branchId, queueId });
}

export function trackTicket(ticketId: string) {
  getSocket().emit("trackTicket", { ticketId });
}

export function joinDisplay(tenantId: string, branchId: string) {
  getSocket().emit("joinDisplay", { tenantId, branchId });
}

export function joinCounter(
  tenantId: string,
  branchId: string,
  counterId: string,
) {
  getSocket().emit("joinCounter", { tenantId, branchId, counterId });
}
