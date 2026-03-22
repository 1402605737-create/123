/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  MessageSquare, 
  Leaf, 
  BookOpen, 
  Upload, 
  X, 
  Send, 
  Sparkles,
  ChevronRight,
  History,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { identifyPlant, chatWithGardener } from './services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'atelier' | 'scan' | 'journal' | 'chat';

interface PlantResult {
  id: string;
  image: string;
  analysis: string;
  timestamp: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('atelier');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<PlantResult | null>(null);
  const [history, setHistory] = useState<PlantResult[]>([]);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setIsAnalyzing(true);
      setActiveTab('scan');
      
      try {
        const analysis = await identifyPlant(base64);
        const newResult: PlantResult = {
          id: Date.now().toString(),
          image: base64,
          analysis,
          timestamp: Date.now(),
        };
        setCurrentResult(newResult);
        setHistory(prev => [newResult, ...prev]);
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const geminiHistory = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const response = await chatWithGardener(userMsg, geminiHistory);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error("Chat failed:", error);
      setChatMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting to the botanical archives." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-surface relative overflow-hidden">
      {/* Top Bar */}
      <header className="fixed top-0 w-full max-w-md z-50 glass flex justify-between items-center px-6 h-16 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <Leaf className="text-primary w-5 h-5" />
          <h1 className="font-headline italic text-primary text-xl tracking-tight">The Botanical Atelier</h1>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-highest">
          <img 
            src="https://picsum.photos/seed/gardener/100/100" 
            alt="Profile" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 pb-24 px-6 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'atelier' && (
            <motion.div 
              key="atelier"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-8 space-y-12"
            >
              <section>
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary font-bold mb-2 block">Curated Wisdom</span>
                <h2 className="text-5xl leading-[1.1] mb-6">
                  Turn Your <span className="serif-italic text-primary">Garden Scraps</span> into Botanical Gold.
                </h2>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
                  Identify any plant with a single photo and unlock the secrets of the digital atelier.
                </p>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-3 bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-lg font-semibold shadow-soft active:scale-95 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                    Identify My Plant
                  </button>
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className="flex items-center justify-center gap-3 bg-secondary-container text-on-secondary-container py-4 rounded-lg font-semibold active:scale-95 transition-all"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Consult the Expert
                  </button>
                </div>
              </section>

              <section className="relative rounded-xl overflow-hidden aspect-[4/5] shadow-soft rotate-1 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://picsum.photos/seed/botany/800/1000" 
                  alt="Botanical" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="font-headline text-2xl italic text-white leading-tight">
                    "Every leaf is a story waiting to be read."
                  </p>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between h-40">
                  <Sparkles className="text-tertiary w-6 h-6" />
                  <div>
                    <h3 className="text-lg leading-tight mb-1">AI Insights</h3>
                    <p className="text-xs text-on-surface-variant">Expert care tips</p>
                  </div>
                </div>
                <div className="bg-primary/5 p-6 rounded-xl flex flex-col justify-between h-40 border border-primary/10">
                  <History className="text-primary w-6 h-6" />
                  <div>
                    <h3 className="text-lg leading-tight mb-1">History</h3>
                    <p className="text-xs text-on-surface-variant">{history.length} plants saved</p>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'scan' && (
            <motion.div 
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-4 space-y-6"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-container shadow-soft">
                {isAnalyzing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container/50 backdrop-blur-sm z-20">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="font-label text-xs uppercase tracking-widest text-primary font-bold">Analyzing Specimen...</p>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent animate-pulse pointer-events-none" />
                  </div>
                ) : !currentResult ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
                      <Camera className="w-10 h-10 text-primary/40" />
                    </div>
                    <p className="text-on-surface-variant">Upload a photo to begin the botanical analysis.</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-primary text-on-primary px-6 py-2 rounded-full text-sm font-semibold"
                    >
                      Choose Photo
                    </button>
                  </div>
                ) : null}
                
                {currentResult && (
                  <img 
                    src={currentResult.image} 
                    alt="Scanned plant" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {currentResult && !isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface-container-low p-8 rounded-xl space-y-6"
                >
                  <div className="prose prose-sm prose-stone max-w-none">
                    <div className="markdown-body">
                      <Markdown>
                        {currentResult.analysis}
                      </Markdown>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setCurrentResult(null);
                      fileInputRef.current?.click();
                    }}
                    className="w-full py-3 border-2 border-dashed border-outline-variant rounded-lg text-sm font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant/20 transition-colors"
                  >
                    Scan Another
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'journal' && (
            <motion.div 
              key="journal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="pt-8 space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl">Botanical Journal</h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{history.length} Entries</span>
              </div>

              {history.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <BookOpen className="w-12 h-12 text-outline-variant mx-auto opacity-40" />
                  <p className="text-on-surface-variant">Your journal is empty. Start by scanning a plant.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {history.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => {
                        setCurrentResult(item);
                        setActiveTab('scan');
                      }}
                      className="w-full flex gap-4 p-4 bg-surface-container-low rounded-xl text-left hover:bg-surface-container transition-colors group"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image} alt="Plant" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-lg leading-tight group-hover:text-primary transition-colors">
                          {item.analysis.split('\n')[0].replace('# ', '') || 'Unnamed Plant'}
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <ChevronRight className="w-5 h-5 text-outline-variant" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-12rem)] flex flex-col"
            >
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 py-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-tertiary/5 flex items-center justify-center mx-auto">
                      <Sparkles className="text-tertiary w-8 h-8" />
                    </div>
                    <h3 className="text-xl">Ask the Atelier</h3>
                    <p className="text-sm text-on-surface-variant max-w-[200px] mx-auto">
                      Expert advice on care, pests, or garden design.
                    </p>
                  </div>
                )}
                
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-primary text-on-primary rounded-tr-none" 
                        : "bg-surface-container-low text-on-surface rounded-tl-none border border-outline-variant/10"
                    )}>
                      <div className="markdown-body">
                        <Markdown>
                          {msg.text}
                        </Markdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex gap-2 p-4 bg-surface-container-low rounded-2xl rounded-tl-none w-16 items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="pt-4">
                <div className="relative">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask a question..."
                    className="w-full bg-surface-container-low border-none rounded-full py-4 pl-6 pr-14 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="absolute right-2 top-2 w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 flex justify-around items-center px-4 pb-6 pt-3 glass rounded-t-[2rem] shadow-soft">
        <button 
          onClick={() => setActiveTab('atelier')}
          className={cn(
            "flex flex-col items-center justify-center transition-all",
            activeTab === 'atelier' ? "text-primary" : "text-secondary opacity-60"
          )}
        >
          <Leaf className="w-6 h-6" />
          <span className="font-sans text-[10px] font-semibold uppercase tracking-wider mt-1">Atelier</span>
        </button>

        <button 
          onClick={() => setActiveTab('scan')}
          className={cn(
            "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
            activeTab === 'scan' ? "bg-primary text-white shadow-lg -translate-y-2" : "text-secondary opacity-60"
          )}
        >
          <Camera className="w-6 h-6" />
          {activeTab !== 'scan' && <span className="font-sans text-[10px] font-semibold uppercase tracking-wider mt-1">Scan</span>}
        </button>

        <button 
          onClick={() => setActiveTab('chat')}
          className={cn(
            "flex flex-col items-center justify-center transition-all",
            activeTab === 'chat' ? "text-primary" : "text-secondary opacity-60"
          )}
        >
          <MessageSquare className="w-6 h-6" />
          <span className="font-sans text-[10px] font-semibold uppercase tracking-wider mt-1">Chat</span>
        </button>

        <button 
          onClick={() => setActiveTab('journal')}
          className={cn(
            "flex flex-col items-center justify-center transition-all",
            activeTab === 'journal' ? "text-primary" : "text-secondary opacity-60"
          )}
        >
          <BookOpen className="w-6 h-6" />
          <span className="font-sans text-[10px] font-semibold uppercase tracking-wider mt-1">Journal</span>
        </button>
      </nav>
    </div>
  );
}
