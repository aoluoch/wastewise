import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useSocket } from '../../hooks/useSocket'
import { messagesApi } from '../../api/messagesApi'
import { userApi } from '../../api/userApi'
import type { User } from '../../types'

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  message: string
  timestamp: string
  type: 'text' | 'system'
}

const DirectChat: React.FC = () => {
  const { user } = useAuth()
  const { userId } = useParams<{ userId: string }>()
  const socket = useSocket()
  const [peer, setPeer] = useState<{ id: string; name: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const room = (!user?.id || !userId) ? '' : `dm:${[user.id, userId].sort().join(':')}`

  useEffect(() => {
    if (!userId) return
    userApi.getUser(userId)
      .then((u: User) => setPeer({ id: userId, name: `${u.firstName} ${u.lastName}` }))
      .catch(() => { setPeer({ id: userId, name: 'Collector' }) })
  }, [userId])

  useEffect(() => {
    if (!socket || !room) return

    socket.emit('join_room', room)
    messagesApi.getRoomMessages(room, 1, 50).then(setMessages).catch(() => {
      // Ignore errors loading messages
    })

    type Incoming = {
      room: string
      id: string
      sender?: { id: string; name: string; role: string }
      senderId?: string
      senderName?: string
      senderRole?: string
      message: string
      timestamp: string
      type: 'text' | 'system'
    }

    const handleNewMessage = (...args: unknown[]) => {
      const message = args[0] as Incoming
      if (message && message.room === room) {
        const normalizedSenderId = message.sender?.id || message.senderId || 'system'
        const normalizedSenderName = message.sender?.name || message.senderName || 'System'
        const normalizedSenderRole = message.sender?.role || message.senderRole || 'system'
        setMessages(prev => [...prev, {
          id: message.id,
          senderId: normalizedSenderId,
          senderName: normalizedSenderName,
          senderRole: normalizedSenderRole,
          message: message.message,
          timestamp: message.timestamp,
          type: message.type,
        }])
      }
    }

    socket.on('new_message', handleNewMessage)
    return () => {
      socket.off('new_message', handleNewMessage)
    }
  }, [socket, room])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isOwnMessage = (senderId: string) => senderId === user?.id

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket || !room) return
    socket.emit('send_message', { room, message: newMessage.trim(), type: 'text' })
    setMessages(prev => [...prev, {
      id: `tmp-${Date.now()}`,
      senderId: user!.id,
      senderName: `${user!.firstName} ${user!.lastName}`,
      senderRole: user!.role,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
    }])
    setNewMessage('')
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div className="bg-white dark:bg-gray-800 rounded-t-lg shadow p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Direct Chat</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Chat with {peer?.name || 'Collector'}</p>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${isOwnMessage(m.senderId) ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md ${isOwnMessage(m.senderId) ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'} rounded-lg px-4 py-2`}>
              {!isOwnMessage(m.senderId) && (
                <div className="text-xs font-medium mb-1 opacity-75">{m.senderName}</div>
              )}
              <div className="text-sm">{m.message}</div>
              <div className={`text-xs mt-1 ${isOwnMessage(m.senderId) ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSend} className="flex space-x-2">
          <input className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Send</button>
        </form>
      </div>
    </div>
  )
}

export default DirectChat


