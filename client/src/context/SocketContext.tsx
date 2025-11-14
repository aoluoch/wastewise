import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback?: (...args: unknown[]) => void) => void;
  reconnect: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);
// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user || !user.token) {
      return;
    }

    // Get socket URL from env or fallback to API base URL
    const getSocketURL = () => {
      const socketUrl = import.meta.env.VITE_SOCKET_URL;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      if (socketUrl) {
        return socketUrl;
      }

      // If no socket URL, derive from API URL by removing /api suffix
      if (apiUrl) {
        return apiUrl.replace(/\/api$/, '');
      }

      // Fallback to current origin for development
      return window.location.origin;
    };

    const socketUrl = getSocketURL();

    const newSocket = io(socketUrl, {
      path: '/socket.io/',
      auth: {
        token: user.token,
        userId: user.id || user._id,
      },
      autoConnect: true,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', _reason => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', error => {
      setIsConnected(false);
      setConnectionError(error.message || 'Connection failed');
    });

    newSocket.on('error', error => {
      setConnectionError(error.message || 'Socket error');
    });

    // Use setTimeout to avoid calling setState synchronously in effect
    setTimeout(() => {
      setSocket(newSocket);
    }, 0);

    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
    };
  }, [isAuthenticated, user]);

  const emit = (event: string, data?: unknown) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const on = (event: string, callback: (...args: unknown[]) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: string, callback?: (...args: unknown[]) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const reconnect = () => {
    if (socket) {
      socket.connect();
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionError,
    emit,
    on,
    off,
    reconnect,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
