'use client'

import React, { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'ws://localhost:8080';

const Stream: React.FC = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: '/mediasoup',
    });

    socketRef.current = socket;

   
    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO:', socket.id);
    });

    // Listen for welcome message from server
    socket.on('welcome', (message: string) => {
      console.log('🎉 Server welcome message:', message);
    });

    // Send test message to server
    socket.emit('message', 'Hello from frontend');

    // Trigger createTransport and handle callback
    socket.emit('createTransport', { sender: true }, (response: any) => {
      console.log('🚀 Received transport data from server:', response);
    });

    // Cleanup connection on unmount
    return () => {
      socket.disconnect();
      console.log('🔌 Disconnected from Socket.IO');
    };
  }, []);

  return (
    <div>
      <h2>Stream Component</h2>
    </div>
  );
};

export default Stream;
