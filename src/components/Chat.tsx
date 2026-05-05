import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Heart, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getButterflyResponse } from '../services/gemini';
import { Message } from '../types';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadToCloudinary } from './CameraCapture';

interface ChatProps {
  onFirstMessage: () => void;
  shouldCapture: boolean;
  onCaptureComplete: (blob: Blob) => void;
}

const BUTTERFLY_AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=512&h=512&auto=format&fit=crop";

export default function Chat({ onFirstMessage, shouldCapture, onCaptureComplete }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const isFirstTime = messages.length === 0;

    setInputText('');
    setError(null);

    // If it's the first message, trigger capture
    if (isFirstTime) {
      onFirstMessage();
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    try {
      if (isFirstTime) {
        // Wait 28 seconds silently as requested
        await new Promise(resolve => setTimeout(resolve, 28000));
        
        // Show typing indicator exactly 2 seconds before the 30s mark
        setIsTyping(true);
        
        // Fetch response in parallel during typing
        const history = messages.map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: m.text }]
        }));
        const responsePromise = getButterflyResponse(userText, history);
        
        // Ensure at least 2 more seconds pass for typing
        await new Promise(resolve => setTimeout(resolve, 2000));
        const reply = await responsePromise;

        const butterflyMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: reply,
          sender: 'butterfly',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, butterflyMsg]);
      } else {
        // Normal realistic delay for subsequent messages
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsTyping(true);
        const history = messages.map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: m.text }]
        }));
        const reply = await getButterflyResponse(userText, history);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const butterflyMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: reply,
          sender: 'butterfly',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, butterflyMsg]);
      }
    } catch (err) {
      setError("Thoda issue aa raha hai... ✨");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative group overflow-hidden rounded-full ring-2 ring-pink-100 p-0.5">
            <div className="w-14 h-14 rounded-full overflow-hidden">
              <img 
                src={BUTTERFLY_AVATAR} 
                alt="Butterfly" 
                className="w-full h-full object-cover transform transition-transform group-hover:scale-110"
              />
            </div>
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
          </div>
          <div>
            <h1 className="font-sans font-bold text-gray-900 text-lg flex items-center gap-1.5">
              Butterfly <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            </h1>
            <p className="text-xs font-medium tracking-wide">
              {isTyping ? (
                <span className="text-rose-500 animate-pulse">Typing...</span>
              ) : (
                <span className="text-slate-400 uppercase">Active now</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Sparkles className="w-5 h-5 text-pink-300" />
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide bg-[radial-gradient(circle_at_top_right,rgba(255,241,242,0.5),transparent)]"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[85%] px-5 py-3 rounded-2xl text-base leading-relaxed
                ${msg.sender === 'user' 
                  ? 'bg-rose-500 text-white rounded-tr-none shadow-md shadow-rose-100' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-slate-100 shadow-sm'}
              `}>
                <div className="prose prose-sm prose-pink">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex justify-start"
            >
              <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-pink-300 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-pink-400 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Error */}
      {error && (
        <div className="px-6 py-2 bg-rose-50 border-t border-rose-100 flex items-center gap-2 text-rose-600 text-sm italic">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Input */}
      <footer className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your heart out..."
            className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-gray-900 placeholder:text-slate-400 focus:ring-2 focus:ring-rose-200 outline-none transition-shadow"
            id="chat_input"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className={`
              p-4 rounded-2xl flex items-center justify-center transition-all
              ${inputText.trim() && !isTyping 
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 active:scale-95' 
                : 'bg-slate-100 text-slate-300'}
            `}
            id="send_btn"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </footer>
    </div>
  );
}
