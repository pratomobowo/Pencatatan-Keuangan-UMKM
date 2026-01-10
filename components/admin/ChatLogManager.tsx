'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import {
    MessageSquare,
    User,
    Bot,
    Calendar,
    ChevronRight,
    Search,
    Clock,
    UserCircle,
    Phone
} from 'lucide-react';

export const ChatLogManager: React.FC = () => {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchChatLogs();
    }, []);

    const fetchChatLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/chat-logs');
            const data = await res.json();
            if (Array.isArray(data)) {
                setConversations(data);
                if (data.length > 0 && !selectedId) {
                    setSelectedId(data[0].id);
                }
            }
        } catch (err) {
            console.error("Error fetching chat logs:", err);
        } finally {
            setLoading(false);
        }
    };

    const selectedConv = conversations.find(c => c.id === selectedId);

    const filteredConversations = conversations.filter(c =>
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in -mx-4 md:mx-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
                {/* Conversation List */}
                <Card className="lg:col-span-4 p-0 overflow-hidden flex flex-col bg-white border-slate-200">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Cari percakapan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                        {loading ? (
                            <div className="p-8 text-center">
                                <Clock className="mx-auto text-slate-300 animate-spin mb-2" size={24} />
                                <p className="text-sm text-slate-400">Loading...</p>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                Tidak ada percakapan ditemukan.
                            </div>
                        ) : (
                            filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedId(conv.id)}
                                    className={`w-full p-4 text-left transition-all hover:bg-blue-50/50 flex items-start gap-3 ${selectedId === conv.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl shrink-0 ${conv.customer ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {conv.customer ? <UserCircle size={18} /> : <User size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-slate-900 truncate pr-2">
                                                {conv.customer?.name || 'Anonymous User'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                {new Date(conv.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="text-xs text-slate-500 truncate italic">
                                            "{conv.title}"
                                        </h4>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-300 mt-1" />
                                </button>
                            ))
                        )}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total: {filteredConversations.length}</span>
                        <button onClick={fetchChatLogs} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Refresh</button>
                    </div>
                </Card>

                {/* Chat Detail */}
                <Card className="lg:col-span-8 p-0 overflow-hidden flex flex-col bg-slate-50/30 border-slate-200">
                    {selectedConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${selectedConv.customer ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {selectedConv.customer ? <UserCircle size={20} /> : <User size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            {selectedConv.customer?.name || 'Anonymous User'}
                                        </h3>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5 font-medium">
                                            {selectedConv.customer?.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={10} /> {selectedConv.customer.phone}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 uppercase">
                                                <Calendar size={10} />
                                                {new Date(selectedConv.createdAt).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Message History */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                                {selectedConv.messages.map((msg: any) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`size-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white'
                                                }`}>
                                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                            </div>
                                            <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                    ? 'bg-slate-800 text-white rounded-tr-none'
                                                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                                                }`}>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                <span className={`text-[9px] mt-2 block ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
                            <Bot className="mb-4 opacity-20" size={64} />
                            <p className="text-sm">Pilih percakapan untuk melihat riwayat log.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};
