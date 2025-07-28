'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const models = [
  'cognitivecomputations/dolphin3.0-mistral-24b:free',
  'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
      body: JSON.stringify({ messages: newMessages, model: selectedModel }),
    });

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      setMessages((prevMessages) => [...prevMessages, data.choices[0].message]);
    }
  };

  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/;

  return (
    <div className="flex flex-col h-screen p-4">
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>OpenRouter Chat</CardTitle>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => {
            const thinkingMatch = msg.content.match(thinkingRegex);
            let thinkingContent = thinkingMatch ? thinkingMatch[1] : '';
            let mainContent = msg.content.replace(thinkingRegex, '').trim();

            mainContent = mainContent.replace(/<\| User \|>(.|\n)*<\| Assistant \|>/, '').trim();
            thinkingContent = thinkingContent.replace(/<\| User \|>(.|\n)*<\| Assistant \|>/, '').trim();

            return (
              <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {thinkingContent && (
                    <div className="mb-2 p-2 border-b">
                      <h4 className="font-semibold">Thinking...</h4>
                      <p className="text-sm">{thinkingContent}</p>
                    </div>
                  )}
                  {mainContent}
                </div>
              </div>
            );
          })}
        </CardContent>
        <form onSubmit={handleSubmit} className="p-4 flex gap-2 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1"
          />
          <Button type="submit">Send</Button>
        </form>
      </Card>
    </div>
  );
}