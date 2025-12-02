'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, User, Loader2 } from 'lucide-react';
import { useStore } from '../store';

const SUGGESTIONS = [
  "Generate a rough cut from media",
  "Create captions for this video",
  "Suggest background music",
  "Explain how to use the timeline"
];

// Placeholder AI response generator
async function generateAIResponse(prompt: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const responses: Record<string, string> = {
    "Generate a rough cut from media": "I'll analyze your media clips and create a rough cut. To do this, I'll:\n\n1. Arrange clips in chronological order\n2. Add smooth transitions between scenes\n3. Sync any audio tracks\n\nWould you like me to proceed?",
    "Create captions for this video": "I can generate captions for your video. This will:\n\n1. Transcribe all spoken content\n2. Add timing markers\n3. Style the captions for readability\n\nNote: For best results, ensure your audio is clear.",
    "Suggest background music": "Based on your video content, I'd suggest:\n\n1. Upbeat electronic for fast-paced sections\n2. Ambient/chill for slower moments\n3. Cinematic for dramatic scenes\n\nYou can browse our music library in the left sidebar.",
    "Explain how to use the timeline": "The timeline is where you arrange your video clips:\n\n- Drag clips from the media library to add them\n- Click and drag edges to trim\n- Use the playhead to preview\n- Right-click for more options like split and duplicate"
  };

  return responses[prompt] || `I'll help you with: "${prompt}"\n\nThis feature is coming soon! For now, you can:\n- Drag media to the timeline\n- Use the preview to check your edits\n- Export when ready`;
}

const AIChat: React.FC = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    addMessage,
    isGenerating,
    setGenerating
  } = useStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userText = input;
    setInput('');

    // Add User Message
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    });

    setGenerating(true);

    // Call AI
    const responseText = await generateAIResponse(userText);

    // Add Model Message
    addMessage({
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    });

    setGenerating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#141414]">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a2a] flex items-center space-x-2 bg-[#1a1a1a]">
        <div className="p-1.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
            <h3 className="font-semibold text-sm text-white">AI Assistant</h3>
            <p className="text-[10px] text-gray-500">Video editing help</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-[#3a3a3a] text-white rounded-tr-sm'
                  : 'bg-[#1a1a1a] text-gray-300 border border-[#2a2a2a] rounded-tl-sm'
              }`}
            >
               <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase font-bold tracking-wider">
                  {msg.role === 'user' ? <User className="w-3 h-3"/> : <Bot className="w-3 h-3" />}
                  {msg.role === 'user' ? 'You' : 'AI'}
               </div>
              <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
             <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Thinking...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length < 3 && (
        <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setInput(s)}
                        className="text-xs bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-500 hover:text-white px-3 py-1.5 rounded-full border border-[#2a2a2a] transition-colors"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to help edit..."
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white text-sm rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            disabled={isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="absolute right-2 top-2 p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
