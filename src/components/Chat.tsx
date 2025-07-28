'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Plus, Mic, ArrowUp, Menu } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatHistory {
  sessionId: string;
  messages: Message[];
}

const models = [
  'cognitivecomputations/dolphin3.0-mistral-24b:free',
  'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
];

// Simple hash function for the session ID
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [sessionId, setSessionId] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
    const newSessionId = hashString(new Date().toISOString());
    setSessionId(newSessionId);
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewChat = () => {
    const newSessionId = hashString(new Date().toISOString());
    setSessionId(newSessionId);
    setMessages([]);
  };

  const handleSelectChat = (selectedSessionId: string) => {
    const chat = chatHistory.find((chat) => chat.sessionId === selectedSessionId);
    if (chat) {
      setSessionId(chat.sessionId);
      setMessages(chat.messages);
    }
    setIsSidebarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: newMessages, model: selectedModel, sessionId }),
    });

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      const newBotMessage = data.choices[0].message;
      const updatedMessages = [...newMessages, newBotMessage];
      setMessages(updatedMessages);

      const existingChatIndex = chatHistory.findIndex((chat) => chat.sessionId === sessionId);
      if (existingChatIndex !== -1) {
        const updatedHistory = [...chatHistory];
        updatedHistory[existingChatIndex] = { sessionId, messages: updatedMessages };
        setChatHistory(updatedHistory);
      } else {
        setChatHistory([...chatHistory, { sessionId, messages: updatedMessages }]);
      }
    }
  };

  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      <div className={`fixed top-0 left-0 h-full w-64 bg-secondary text-secondary-foreground p-4 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 z-20`}>
        <Button onClick={handleNewChat} className="w-full mb-4 bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> New Chat
        </Button>
        <ul>
          {chatHistory.map((chat) => (
            <li
              key={chat.sessionId}
              onClick={() => handleSelectChat(chat.sessionId)}
              className={`p-2 cursor-pointer rounded-md ${sessionId === chat.sessionId ? 'bg-primary/50' : 'hover:bg-primary/20'}`}
            >
              {chat.messages[0]?.content.substring(0, 20) || 'New Chat'}...
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-grow flex flex-col">
        <header className="p-4 flex justify-between items-center">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full md:w-[280px] bg-secondary border-border">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="bg-secondary text-secondary-foreground border-border">
              {models.map((model) => (
                <SelectItem key={model} value={model} className="hover:bg-primary/20">
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ThemeToggle />
        </header>
        <main ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <h2 className="text-4xl font-bold text-muted-foreground">Yet another chatgpt</h2>
            </div>
          )}
          {messages.map((msg, i) => {
            const thinkingMatch = msg.content.match(thinkingRegex);
            let thinkingContent = thinkingMatch ? thinkingMatch[1] : '';
            let mainContent = msg.content.replace(thinkingRegex, '').trim();

            mainContent = mainContent.replace(/<\| User \|>(.|\n)*<\| Assistant \|>/, '').trim();
            thinkingContent = thinkingContent.replace(/<\| User \|>(.|\n)*<\| Assistant \|>/, '').trim();

            return (
              <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  {thinkingContent && (
                    <div className="mb-2 p-2 border-b border-border">
                      <h4 className="font-semibold">Thinking...</h4>
                      <p className="text-sm text-muted-foreground">{thinkingContent}</p>
                    </div>
                  )}
                  {mainContent}
                </div>
              </div>
            );
          })}
        </main>
        <footer className="p-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-secondary p-2 rounded-lg">
            <Button variant="ghost" size="icon">
              <Plus className="h-6 w-6" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none focus:ring-0"
            />
            <Button variant="ghost" size="icon">
              <Mic className="h-6 w-6" />
            </Button>
            <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90">
              <ArrowUp className="h-6 w-6" />
            </Button>
          </form>
        </footer>
      </div>
    </div>
  );
}