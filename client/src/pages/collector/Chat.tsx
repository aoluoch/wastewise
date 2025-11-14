import React, { useState, useEffect, useRef } from 'react';
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

const CollectorChat: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>(() => {
    // Initialize with welcome message if user exists
    if (user) {
      return [
        {
          id: `welcome-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          senderRole: 'system',
          message: `Welcome to the collector chat, ${user.firstName}! You can communicate with other collectors and receive system updates here.`,
          timestamp: new Date().toISOString(),
          type: 'system',
        },
      ];
    }
    return [];
  });
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(
    () => socket?.isConnected || false
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Resolve the room name for collectors
  const collectorRoom = 'role:collector';

  // Load history and setup socket listeners
  useEffect(() => {
    if (socket) {
      // Join collector role room used by backend
      socket.emit('join_room', collectorRoom);

      // Load recent history
      messagesApi
        .getRoomMessages(collectorRoom, 1, 50)
        .then(history => {
          setMessages(prev => {
            // Keep existing welcome message if present, then history
            const existingSystem = prev.filter(m => m.type === 'system');
            return [...existingSystem, ...history];
          });
        })
        .catch(() => {
          // Ignore errors loading messages
        });

      // Listen for messages
      const handleNewMessage = (...args: unknown[]) => {
        const message = args[0] as Message;
        setMessages(prev => [...prev, message]);
      };

      // Listen for system notifications
      const handleSystemNotification = (...args: unknown[]) => {
        const notification = args[0] as { message: string };
        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          senderRole: 'system',
          message: notification.message,
          timestamp: new Date().toISOString(),
          type: 'system',
        };
        setMessages(prev => [...prev, systemMessage]);
      };

      socket.on('new_message', handleNewMessage);
      socket.on('system_notification', handleSystemNotification);

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('system_notification', handleSystemNotification);
      };
    }
  }, [socket, user]);

  // Sync connection status using socket events
  useEffect(() => {
    if (socket?.socket) {
      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      // Listen for connection events
      socket.socket.on('connect', handleConnect);
      socket.socket.on('disconnect', handleDisconnect);

      return () => {
        socket.socket?.off('connect', handleConnect);
        socket.socket?.off('disconnect', handleDisconnect);
      };
    }
  }, [socket]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !user) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      senderRole: user.role,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    // Emit message to server
    socket.emit('send_message', {
      room: collectorRoom,
      message: message.message,
      type: message.type,
    });

    // Add message to local state immediately
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isOwnMessage = (senderId: string) => senderId === user?.id;

  return (
    <div className='h-[calc(100vh-12rem)] flex flex-col'>
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 rounded-t-lg shadow p-4 border-b border-gray-200 dark:border-gray-700'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
              Collector Chat 💬
            </h1>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Communicate with other collectors and receive updates
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className='text-sm text-gray-600 dark:text-gray-400'>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className='flex-1 bg-white dark:bg-gray-800 overflow-y-auto p-4 space-y-4'>
        {messages.length === 0 ? (
          <div className='text-center text-gray-500 dark:text-gray-400 py-8'>
            <span className='text-4xl mb-4 block'>💬</span>
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const showDate =
              index === 0 ||
              formatDate(message.timestamp) !==
                formatDate(messages[index - 1].timestamp);

            return (
              <div key={message.id}>
                {showDate && (
                  <div className='text-center text-xs text-gray-500 dark:text-gray-400 my-4'>
                    {formatDate(message.timestamp)}
                  </div>
                )}

                {message.type === 'system' ? (
                  <div className='text-center'>
                    <div className='inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm'>
                      {message.message}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex ${isOwnMessage(message.senderId) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md ${
                        isOwnMessage(message.senderId)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      } rounded-lg px-4 py-2`}
                    >
                      {!isOwnMessage(message.senderId) && (
                        <div className='text-xs font-medium mb-1 opacity-75'>
                          {message.senderName}
                        </div>
                      )}
                      <div className='text-sm'>{message.message}</div>
                      <div
                        className={`text-xs mt-1 ${
                          isOwnMessage(message.senderId)
                            ? 'text-blue-100'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className='bg-white dark:bg-gray-800 rounded-b-lg shadow p-4 border-t border-gray-200 dark:border-gray-700'>
        <form onSubmit={handleSendMessage} className='flex space-x-2'>
          <input
            type='text'
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder={isConnected ? 'Type your message...' : 'Connecting...'}
            disabled={!isConnected}
            className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
          />
          <button
            type='submit'
            disabled={!newMessage.trim() || !isConnected}
            className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            Send
          </button>
        </form>

        {/* Quick Actions */}
        <div className='mt-3 flex flex-wrap gap-2'>
          <button
            onClick={() => setNewMessage('Need assistance with current task')}
            className='px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
          >
            🆘 Need Help
          </button>
          <button
            onClick={() => setNewMessage('Task completed successfully')}
            className='px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
          >
            ✅ Task Done
          </button>
          <button
            onClick={() =>
              setNewMessage('Running late, will arrive in 15 minutes')
            }
            className='px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
          >
            ⏰ Running Late
          </button>
          <button
            onClick={() => setNewMessage('Available for additional tasks')}
            className='px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
          >
            🚛 Available
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectorChat;
