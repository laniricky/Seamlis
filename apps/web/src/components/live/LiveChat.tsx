'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Send, Users } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export function LiveChat({ streamId, viewerCount }: { streamId: string, viewerCount: number }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial history
    fetch(`http://localhost:8080/api/v1/live/${streamId}/messages`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(console.error);

    // Connect WS
    const ws = new WebSocket(`ws://localhost:8080/api/v1/live/${streamId}/chat`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages(prev => [...prev, msg]);
      } catch (e) {
        console.error('Failed to parse chat message', e);
      }
    };
    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [streamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !wsRef.current) return;
    
    wsRef.current.send(JSON.stringify({
      userId: user.id,
      content: input.trim()
    }));
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
        <h3 className="font-semibold text-gray-900 dark:text-white">Live Chat</h3>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Users className="w-4 h-4 mr-1" />
          {viewerCount}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px]">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3 text-sm">
            {/* We'd typically fetch usernames, but omitting for brevity in chat UI */}
            <div className="font-semibold text-seamlis-green flex-shrink-0">
              User
            </div>
            <div className="text-gray-700 dark:text-gray-300 break-words">
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        {!user ? (
          <div className="text-sm text-center text-gray-500">
            Sign in to chat
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Say something..."
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-seamlis-green"
              maxLength={200}
            />
            <Button type="submit" size="sm" variant="primary" disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
