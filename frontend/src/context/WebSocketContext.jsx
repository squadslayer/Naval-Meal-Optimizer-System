import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext.jsx';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // Only admins should connect
    if (user?.role !== 'admin') {
      return;
    }

    // --- FINAL FIX: Append the JWT token to the WebSocket URL ---
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        console.error("No access token found for WebSocket connection.");
        return; // Don't try to connect without a token
    }

    // Use a relative URL for the proxy, and add the token as a query parameter
    const wsUrl = `ws://${window.location.host}/ws/dashboard/?token=${accessToken}`;

    // Establish the connection
    wsRef.current = new WebSocket(wsUrl);

    // --- Event Handlers ---
    wsRef.current.onopen = () => {
      console.log('WebSocket connected successfully.');
      setIsConnected(true);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected.');
      setIsConnected(false);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      // This is where you might see errors if the backend rejects the connection
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update') {
        setMessages(prev => [data.payload, ...prev].slice(0, 20));
      }
      if (data.type === 'update' && data.payload.type === 'stock_alert') {
        toast.error(`Low Stock: ${data.payload.item_name} is at ${data.payload.quantity}`);
      }
    };

    // Cleanup on component unmount
    const wsCurrent = wsRef.current;
    return () => {
      wsCurrent.close();
    };
  }, [user]); // Rerun effect if the user changes

  const value = { isConnected, messages };
  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};