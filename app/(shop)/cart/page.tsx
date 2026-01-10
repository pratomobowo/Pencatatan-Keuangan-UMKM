'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Trash2, Minus, Plus, ArrowRight, MessageSquare, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function CartPage() {
    const { items: cartItems, removeItem, updateQuantity, updateNote, itemCount, subtotal, totalSavings } = useCart();
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [tempNote, setTempNote] = useState('');

    const handleQuantityChange = (id: string, variant: string, delta: number) => {
        const item = cartItems.find(i => i.id === id && i.variant === variant);
        if (item) {
            updateQuantity(id, variant, item.quantity + delta);
        }
    };

    const openNoteEditor = (id: string, variant: string, currentNote?: string) => {
        setEditingNoteId(`${id}-${variant}`);
        setTempNote(currentNote || '');
    };

    const saveNote = (id: string, variant: string) => {
        updateNote(id, variant, tempNote);
        setEditingNoteId(null);
        setTempNote('');
    };

    return (
        <>
            {/* Header */}
            <div className="sticky top-0 z-50 flex items-center bg-white/90 backdrop-blur-md px-4 py-3 shadow-sm justify-between">
                <Link href="/" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50 cursor-pointer">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="text-stone-900 text-lg font-semibold flex-1 text-center pr-10">Keranjang Belanja</h2>
            </div>

            {/* Cart Items Header */}
            <div className="px-4 pb-2 pt-6 flex justify-between items-end">
                <h3 className="text-stone-900 text-lg font-semibold">Daftar Pesanan</h3>
                <span className="text-sm text-orange-600 font-medium">{itemCount} Item</span>
            </div>

            {/* Cart Items */}
            {cartItems.length === 0 ? (
                <div className="mx-4 mt-2 p-8 bg-white rounded-xl border border-orange-50 text-center">
                    <p className="text-gray-500">Keranjang belanja kosong</p>
                    <Link href="/" className="text-orange-500 font-bold mt-2 inline-block">
                        Belanja Sekarang
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-3 mx-4 mt-2">
                    {cartItems.map((item) => (
                        <div key={`${item.id}-${item.variant}`} className="flex flex-col bg-white rounded-xl p-4 shadow-sm border border-orange-50">
                            <div className="flex gap-3">
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    <Image
                                        src={item.image || '/placeholder.png'}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-stone-900 font-semibold text-sm line-clamp-1">{item.name}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-orange-600 font-bold text-base">Rp {item.price.toLocaleString('id-ID')}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleQuantityChange(item.id, item.variant, -1)}
                                                className="flex items-center justify-center size-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, item.variant, 1)}
                                                className="flex items-center justify-center size-6 rounded-full bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeItem(item.id, item.variant)}
                                    className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors self-start"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Note Section */}
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                {item.note ? (
                                    <div className="flex items-start gap-2 bg-amber-50 p-2 rounded-lg">
                                        <MessageSquare size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-800 flex-1">{item.note}</p>
                                        <button
                                            onClick={() => openNoteEditor(item.id, item.variant, item.note)}
                                            className="text-xs text-amber-600 font-medium hover:underline"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => openNoteEditor(item.id, item.variant)}
                                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 transition-colors"
                                    >
                                        <MessageSquare size={14} />
                                        <span>Tambah catatan (misal: kupas kulit, potong-potong)</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Divider */}
            {cartItems.length > 0 && <div className="mx-4 my-6 h-px bg-gray-200"></div>}

            {/* Payment Summary */}
            {cartItems.length > 0 && (
                <div className="px-4 pb-48">
                    <h3 className="text-stone-900 text-lg font-bold mb-4">Rincian Pembayaran</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Subtotal Produk</span>
                            <span className="font-medium text-stone-900">Rp {(subtotal + totalSavings).toLocaleString('id-ID')}</span>
                        </div>
                        {totalSavings > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-emerald-600 font-medium italic">Hemat Promo</span>
                                <span className="font-medium text-emerald-600">- Rp {totalSavings.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Biaya Pengiriman</span>
                            <span className="text-xs text-gray-400">Dihitung di checkout</span>
                        </div>
                        <div className="my-2 border-t border-dashed border-gray-300"></div>
                        <div className="flex justify-between items-center text-base font-semibold">
                            <span className="text-stone-900">Subtotal</span>
                            <span className="text-stone-900">Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Bar */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-[70px] left-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-4 py-4 z-40">
                    <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-medium">Subtotal</span>
                            <span className="text-xl font-semibold text-stone-900">Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <Link
                            href="/checkout"
                            className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-300/30"
                        >
                            <span className="text-white font-semibold text-base">Lanjut Checkout</span>
                            <ArrowRight className="text-white" size={20} />
                        </Link>
                    </div>
                </div>
            )}

            {/* Note Editor Modal */}
            {editingNoteId && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
                    <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 pb-24 animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-stone-900">Catatan Produk</h3>
                            <button
                                onClick={() => {
                                    setEditingNoteId(null);
                                    setTempNote('');
                                }}
                                className="text-gray-500 p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                            Tambahkan catatan khusus untuk produk ini (misal: kupas kulit, potong dadu, buang kepala, dll)
                        </p>
                        <textarea
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            placeholder="Tulis catatan di sini..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 resize-none text-sm"
                            autoFocus
                        />
                        <div className="flex gap-3 mt-4">
                            {cartItems.find(i => `${i.id}-${i.variant}` === editingNoteId)?.note && (
                                <button
                                    onClick={() => {
                                        const item = cartItems.find(i => `${i.id}-${i.variant}` === editingNoteId);
                                        if (item) {
                                            updateNote(item.id, item.variant, '');
                                            setEditingNoteId(null);
                                            setTempNote('');
                                        }
                                    }}
                                    className="px-4 py-3 text-rose-500 font-medium rounded-xl border border-rose-200 hover:bg-rose-50 transition-colors"
                                >
                                    Hapus
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    const item = cartItems.find(i => `${i.id}-${i.variant}` === editingNoteId);
                                    if (item) {
                                        saveNote(item.id, item.variant);
                                    }
                                }}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-200 transition-all"
                            >
                                Simpan Catatan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
