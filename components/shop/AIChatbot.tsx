'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, User, Bot, Sparkles, Plus, ShoppingCart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const ChatProductCard = ({ productId }: { productId: string }) => {
    const { addItem } = useCart();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products`);
                const data = await res.json();
                const found = data.find((p: any) => p.id === productId);
                setProduct(found);
            } catch (err) {
                console.error("Error fetching product for chat:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    if (loading) return <div className="h-20 w-full animate-pulse bg-gray-100 rounded-xl" />;
    if (!product) return null;

    const currentPrice = product.promoPrice || product.price;

    const handleAdd = () => {
        addItem({
            id: product.id,
            name: product.name,
            variant: product.unit,
            price: Number(currentPrice),
            image: product.image || '/images/coming-soon.jpg',
            originalPrice: product.price ? Number(product.price) : undefined
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <div className="mt-3 bg-white border border-orange-100 rounded-xl overflow-hidden shadow-sm flex items-center gap-2 p-2 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative size-14 rounded-lg overflow-hidden shrink-0">
                <Image
                    src={product.image || '/images/coming-soon.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-bold text-stone-900 truncate">{product.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-bold text-orange-600">Rp {Number(currentPrice).toLocaleString('id-ID')}</span>
                    {product.isPromo && (
                        <span className="text-[9px] text-gray-400 line-through">Rp {Number(product.price).toLocaleString('id-ID')}</span>
                    )}
                </div>
                {product.variants && product.variants.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {product.variants.map((v: any, i: number) => (
                            <span key={i} className="text-[7px] font-bold text-orange-600 bg-orange-50 px-1 py-0.5 rounded border border-orange-100">
                                {v.unit}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <button
                onClick={handleAdd}
                className={`size-9 rounded-lg flex items-center justify-center transition-all shrink-0 ${added ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
            >
                {added ? <ShoppingCart size={16} /> : <Plus size={16} />}
            </button>
        </div>
    );
};

const WhatsAppChatCard = () => {
    const [waNumber, setWaNumber] = useState('6281234567890');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/shop/config');
                const data = await res.json();
                if (data.contactInfo?.whatsapp) {
                    let num = data.contactInfo.whatsapp;
                    setWaNumber(num.startsWith('0') ? '62' + num.slice(1) : num);
                }
            } catch (err) {
                console.error("Error fetching WA number for chat:", err);
            }
        };
        fetchConfig();
    }, []);

    return (
        <div className="mt-4 bg-white border border-green-100 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 p-3">
                <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                    <MessageCircle size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-stone-900">Butuh Bantuan Manual?</h4>
                    <p className="text-[9px] text-stone-400">Chat Admin via WhatsApp</p>
                </div>
            </div>
            <div className="px-3 pb-3">
                <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all active:scale-95 shadow-sm shadow-green-100"
                >
                    Chat Sekarang
                </a>
            </div>
        </div>
    );
};

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Halo! Saya Minsar, asisten AI Pasarantar. Ada yang bisa saya bantu seputar ikan segar, seafood, ayam, atau daging hari ini? 🐟🍗🍖' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Draggable Logic
    const [yPosition, setYPosition] = useState(50); // Default 50%
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef<number>(0);
    const initialY = useRef<number>(0);
    const hasDragged = useRef(false);

    // Load saved position
    useEffect(() => {
        const saved = localStorage.getItem('minsar-y-pos');
        if (saved) {
            setYPosition(Number(saved));
        }
    }, []);

    const handleDragStart = (clientY: number) => {
        setIsDragging(true);
        dragStartY.current = clientY;
        initialY.current = yPosition;
        hasDragged.current = false;
    };

    const handleDragMove = (clientY: number, e?: MouseEvent | TouchEvent) => {
        if (!isDragging) return;

        // Prevent page scrolling while dragging
        if (e && e.cancelable) {
            e.preventDefault();
        }

        const deltaY = clientY - dragStartY.current;
        const screenHeight = window.innerHeight;
        const deltaPercent = (deltaY / screenHeight) * 100;

        let newPos = initialY.current + deltaPercent;

        // Boundaries (keeping button visible)
        newPos = Math.max(10, Math.min(90, newPos));

        if (Math.abs(deltaY) > 5) {
            hasDragged.current = true;
        }

        setYPosition(newPos);
    };

    const handleDragEnd = () => {
        if (isDragging) {
            setIsDragging(false);
            localStorage.setItem('minsar-y-pos', yPosition.toString());
        }
    };

    useEffect(() => {
        if (isDragging) {
            const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY, e);
            const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientY, e);
            const onEnd = () => handleDragEnd();

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('touchend', onEnd);

            return () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onEnd);
                window.removeEventListener('touchmove', onTouchMove);
                window.removeEventListener('touchend', onEnd);
            };
        }
    }, [isDragging, yPosition]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    messages: [...messages, { role: 'user', content: userMessage }].map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Gagal tersambung ke Minsar');

            if (data.conversationId) setConversationId(data.conversationId);
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Maaf Puh, sepertinya Minsar lagi gangguan: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Sidebar Button - Rotated Vertical (Extra Slim) */}
            <button
                onMouseDown={(e) => handleDragStart(e.clientY)}
                onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
                onClick={() => {
                    if (!hasDragged.current) setIsOpen(true);
                }}
                className={`fixed right-0 z-[60] bg-orange-500/95 hover:bg-orange-600 text-white py-2 px-1.5 rounded-l-lg shadow-[-2px_0_8px_rgba(249,115,22,0.2)] transition-colors flex flex-col items-center gap-1 group backdrop-blur-sm ${isDragging ? 'cursor-grabbing scale-105 shadow-xl' : 'cursor-grab active:scale-95'
                    }`}
                style={{
                    writingMode: 'vertical-rl',
                    top: `${yPosition}%`,
                    transform: 'translateY(-50%)'
                }}
            >
                <div className="flex items-center gap-1 rotate-180">
                    <MessageCircle size={12} className="opacity-90" />
                    <span className="tracking-[0.12em] uppercase text-[10px] font-semibold opacity-100">Chat Minsar</span>
                </div>
            </button>

            {/* Fullscreen Chat Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <header className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-orange-50/50">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-200">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-stone-900 leading-tight">Minsar AI</h2>
                                <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                    <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    Selalu siap membantu Buibu!
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="size-10 flex items-center justify-center rounded-full bg-white border border-orange-100 text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
                        >
                            <X size={24} />
                        </button>
                    </header>

                    {/* Chat Messages Area */}
                    <main className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-stone-50/30">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-stone-800 text-white' : 'bg-orange-500 text-white'
                                        }`}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-stone-800 text-white rounded-tr-none'
                                        : 'bg-white border border-orange-50 text-stone-800 rounded-tl-none'
                                        }`}>
                                        <div className="prose prose-sm max-w-none">
                                            {(() => {
                                                // Split content by [PRODUCT:id] and [WHATSAPP] tags
                                                const parts = msg.content.split(/(\[PRODUCT:[a-zA-Z0-9-]+\]|\[WHATSAPP\])/g);
                                                return parts.map((part, pIdx) => {
                                                    const productMatch = part.match(/\[PRODUCT:([a-zA-Z0-9-]+)\]/);
                                                    if (productMatch) {
                                                        return <ChatProductCard key={pIdx} productId={productMatch[1]} />;
                                                    }
                                                    if (part === '[WHATSAPP]') {
                                                        return <WhatsAppChatCard key={pIdx} />;
                                                    }
                                                    return (
                                                        <ReactMarkdown key={pIdx}>
                                                            {part}
                                                        </ReactMarkdown>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="flex gap-3 max-w-[85%]">
                                    <div className="size-8 rounded-full bg-orange-400 flex items-center justify-center text-white shrink-0">
                                        <Bot size={16} />
                                    </div>
                                    <div className="bg-white border border-orange-50 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 italic text-gray-400 text-sm">
                                        <Loader2 size={16} className="animate-spin" />
                                        Minsar lagi mikir...
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </main>

                    {/* Input Area */}
                    <footer className="p-4 bg-white border-t border-orange-100 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] pb-10">
                        <form
                            onSubmit={handleSendMessage}
                            className="max-w-3xl mx-auto flex gap-2"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onFocus={(e) => {
                                    setTimeout(() => {
                                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }, 300);
                                }}
                                placeholder="Tanya apa saja ke Minsar..."
                                className="flex-1 min-w-0 px-5 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl text-stone-800 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="size-14 shrink-0 flex items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-300/40 hover:bg-orange-600 disabled:bg-gray-200 disabled:shadow-none transition-all active:scale-90"
                            >
                                <Send size={24} />
                            </button>
                        </form>
                    </footer>
                </div>
            )}
        </>
    );
}
