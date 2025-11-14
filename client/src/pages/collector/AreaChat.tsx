import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { messagesApi } from '../../api/messagesApi';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
  type: 'text' | 'system';
}

const AreaChat: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const areaRoom = useMemo(() => {
    const lat = (
      user as {
        address?: { coordinates?: { lat?: number; lng?: number } };
      } | null
    )?.address?.coordinates?.lat;
    const lng = (
      user as {
        address?: { coordinates?: { lat?: number; lng?: number } };
      } | null
    )?.address?.coordinates?.lng;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return `area:${lat.toFixed(2)},${lng.toFixed(2)}`;
    }
    return '';
  }, [user]);

  useEffect(() => {
    if (!socket || !areaRoom) return;
    socket.emit('join_room', areaRoom);
    messagesApi
      .getRoomMessages(areaRoom, 1, 50)
      .then(setMessages)
      .catch(() => {
        // Ignore errors loading messages
      });
    type Incoming = {
      room: string;
      id: string;
      sender?: { id: string; name: string; role: string };
      senderId?: string;
      senderName?: string;
      senderRole?: string;
      message: string;
      timestamp: string;
      type: 'text' | 'system';
    };
    const handleNew = (...args: unknown[]) => {
      const msg = args[0] as Incoming;
      if (msg?.room === areaRoom) {
        const normalizedSenderId = msg.sender?.id || msg.senderId || 'system';
        const normalizedSenderName =
          msg.sender?.name || msg.senderName || 'System';
        const normalizedSenderRole =
          msg.sender?.role || msg.senderRole || 'system';
        setMessages(prev => [
          ...prev,
          {
            id: msg.id,
            senderId: normalizedSenderId,
            senderName: normalizedSenderName,
            senderRole: normalizedSenderRole,
            message: msg.message,
            timestamp: msg.timestamp,
            type: msg.type,
          },
        ]);
      }
    };
    socket.on('new_message', handleNew);
    return () => {
      socket.off('new_message', handleNew);
    };
  }, [socket, areaRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !areaRoom || !user) return;
    socket.emit('send_message', {
      room: areaRoom,
      message: newMessage.trim(),
      type: 'text',
    });
    setMessages(prev => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        senderId: user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        senderRole: user.role,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: 'text',
      },
    ]);
    setNewMessage('');
  };

  return (
    <div className='h-[calc(100vh-12rem)] flex flex-col'>
      <div className='bg-white dark:bg-gray-800 rounded-t-lg shadow p-4 border-b border-gray-200 dark:border-gray-700'>
        <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
          Area Chat
        </h1>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          Chat with collectors in your area
        </p>
      </div>
      <div className='flex-1 bg-white dark:bg-gray-800 overflow-y-auto p-4 space-y-4'>
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md ${m.senderId === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'} rounded-lg px-4 py-2`}
            >
              {m.senderId !== user?.id && (
                <div className='text-xs font-medium mb-1 opacity-75'>
                  {m.senderName}
                </div>
              )}
              <div className='text-sm'>{m.message}</div>
              <div
                className={`text-xs mt-1 ${m.senderId === user?.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {new Date(m.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className='bg-white dark:bg-gray-800 rounded-b-lg shadow p-4 border-t border-gray-200 dark:border-gray-700'>
        <form onSubmit={handleSend} className='flex space-x-2'>
          <input
            className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder='Type a message...'
          />
          <button
            type='submit'
            className='px-6 py-2 bg-blue-600 text-white rounded-lg'
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AreaChat;
