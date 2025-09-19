import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext.jsx';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }

    const wsUrl = `ws://${window.location.host}/ws/dashboard/`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => setIsConnected(true);
    wsRef.current.onclose = () => setIsConnected(false);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update' && data.payload.type === 'stock_alert') {
        toast.error(`Low Stock: ${data.payload.item_name} is at ${data.payload.quantity}`);
      }
    };

    const wsCurrent = wsRef.current;
    return () => wsCurrent.close();
  }, [user]);

  const value = { isConnected };
  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};