'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useUserStore } from '@/store/userStore';
import { db } from '@/lib/db';
import { Message } from '@/types';
import { generateId, formatTimeAgo } from '@/lib/utils';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;
  const user = useUserStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [request, setRequest] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const req = db.helpRequests.findById(requestId);
    if (!req) {
      router.push('/dashboard');
      return;
    }

    setRequest(req);
    const otherId = req.requesterId === user.id ? req.volunteerId : req.requesterId;
    const other = db.users.findById(otherId!);
    setOtherUser(other);

    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [user, requestId, router]);

  const loadMessages = () => {
    const msgs = db.messages.findByRequest(requestId);
    setMessages(msgs);
    msgs.filter(m => m.receiverId === user?.id && !m.isRead).forEach(m => {
      db.messages.markAsRead(m.id);
    });
  };

  const handleSend = () => {
    if (!newMessage.trim() || !user || !otherUser) return;

    const message: Message = {
      id: generateId(),
      requestId,
      senderId: user.id,
      receiverId: otherUser.id,
      content: newMessage,
      createdAt: new Date(),
      isRead: false,
    };

    db.messages.create(message);
    db.notifications.create({
      id: generateId(),
      userId: otherUser.id,
      type: 'message',
      title: 'New Message',
      message: `${user.name}: ${newMessage.substring(0, 50)}`,
      isRead: false,
      createdAt: new Date(),
      data: { requestId },
    });

    setNewMessage('');
    loadMessages();
  };

  if (!user || !request || !otherUser) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Chat with {otherUser.name}</h1>
          <Button onClick={() => router.push('/dashboard')} variant="secondary" size="sm">
            Back
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4">
        <Card className="mb-4">
          <h3 className="font-bold">{request.category}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{request.description}</p>
        </Card>

        <Card className="h-96 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-500 text-center">No messages yet</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.senderId === user.id ? 'bg-primary-600 text-white' : 'bg-gray-200'
                  }`}>
                    <p>{msg.content}</p>
                    <p className="text-xs mt-1 opacity-75">{formatTimeAgo(msg.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t p-4 flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button onClick={handleSend}>Send</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
