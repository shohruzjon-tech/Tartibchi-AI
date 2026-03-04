"use client";

import { useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket, getSocket } from "../socket";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  const joinBranch = useCallback((tenantId: string, branchId: string) => {
    getSocket().emit("joinBranch", { tenantId, branchId });
  }, []);

  const leaveBranch = useCallback((tenantId: string, branchId: string) => {
    getSocket().emit("leaveBranch", { tenantId, branchId });
  }, []);

  const joinQueue = useCallback(
    (tenantId: string, branchId: string, queueId: string) => {
      getSocket().emit("joinQueue", { tenantId, branchId, queueId });
    },
    [],
  );

  const trackTicket = useCallback((ticketId: string) => {
    getSocket().emit("trackTicket", { ticketId });
  }, []);

  const joinDisplay = useCallback((tenantId: string, branchId: string) => {
    getSocket().emit("joinDisplay", { tenantId, branchId });
  }, []);

  const joinCounter = useCallback(
    (tenantId: string, branchId: string, counterId: string) => {
      getSocket().emit("joinCounter", { tenantId, branchId, counterId });
    },
    [],
  );

  const onEvent = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      const s = getSocket();
      s.on(event, handler);
      return () => {
        s.off(event, handler);
      };
    },
    [],
  );

  return {
    socket: socketRef.current,
    joinBranch,
    leaveBranch,
    joinQueue,
    trackTicket,
    joinDisplay,
    joinCounter,
    onEvent,
  };
}
