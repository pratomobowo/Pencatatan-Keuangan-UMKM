'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Plus, Trash2 } from 'lucide-react';
import { TabProps } from './types';

export const FaqTab: React.FC<TabProps> = ({ config, setConfig }) => (
    <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Pertanyaan Umum (FAQ)</h3>
        <div className="space-y-4">
            {config.faq.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex-grow space-y-2">
                        <input
                            value={item.question}
                            onChange={e => {
                                const newF = [...config.faq];
                                newF[idx].question = e.target.value;
                                setConfig({ ...config, faq: newF });
                            }}
                            className="w-full p-2.5 text-sm font-semibold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Pertanyaan..."
                        />
                        <textarea
                            value={item.answer}
                            onChange={e => {
                                const newF = [...config.faq];
                                newF[idx].answer = e.target.value;
                                setConfig({ ...config, faq: newF });
                            }}
                            className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                            placeholder="Jawaban..."
                        />
                    </div>
                    <button
                        onClick={() => setConfig({ ...config, faq: config.faq.filter((_, i) => i !== idx) })}
                        className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg shrink-0 transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ))}
            <button
                onClick={() => setConfig({ ...config, faq: [...config.faq, { question: '', answer: '' }] })}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2 font-medium"
            >
                <Plus size={20} /> Tambah FAQ
            </button>
        </div>
    </Card>
);
