'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    Gift,
    Star,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    History,
    Award,
    Copy,
    CheckCircle2,
    Clock,
    Loader2,
    Info,
    ArrowRight
} from 'lucide-react';
import { useShopAuth } from '@/contexts/ShopAuthContext';

interface Reward {
    id: string;
    title: string;
    description: string;
    image: string;
    pointsCost: number;
    type: 'PRODUCT' | 'SHIPPING' | 'DISCOUNT';
    value: number | null;
    productId: string | null;
}

interface Transaction {
    id: string;
    amount: number;
    description: string;
    type: 'EARNED' | 'SPENT' | 'ADJUSTED';
    createdAt: string;
}

interface Voucher {
    id: string;
    code: string;
    type: 'PRODUCT' | 'SHIPPING' | 'DISCOUNT';
    value: number | null;
    isUsed: boolean;
    expiryDate: string;
    product?: { name: string };
}

const TIERS = {
    BRONZE: { name: 'Bronze', color: 'text-orange-700', bg: 'bg-orange-100', minSpent: 0, next: 'SILVER' },
    SILVER: { name: 'Silver', color: 'text-slate-500', bg: 'bg-slate-100', minSpent: 1000000, next: 'GOLD' },
    GOLD: { name: 'Gold', color: 'text-yellow-600', bg: 'bg-yellow-100', minSpent: 5000000, next: null },
};

export default function LoyaltyPage() {
    const router = useRouter();
    const { customer, isAuthenticated, isLoading: authLoading, refreshCustomer } = useShopAuth();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [history, setHistory] = useState<Transaction[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'REWARDS' | 'VOUCHERS' | 'HISTORY'>('REWARDS');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?callbackUrl=/loyalty');
            return;
        }
        if (isAuthenticated) {
            fetchLoyaltyData();
        }
    }, [isAuthenticated, authLoading]);

    const fetchLoyaltyData = async () => {
        try {
            setLoading(true);
            const [rewardsRes, profileRes] = await Promise.all([
                fetch('/api/shop/loyalty/rewards'),
                fetch('/api/shop/loyalty/profile')
            ]);

            if (rewardsRes.ok) setRewards(await rewardsRes.json());
            if (profileRes.ok) {
                const data = await profileRes.json();
                setHistory(data.transactions);
                setVouchers(data.vouchers);
                setTotalSpent(data.totalSpent || 0);
            }
        } catch (error) {
            console.error('Failed to fetch loyalty data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (rewardId: string) => {
        if (!confirm('Tukarkan poin untuk hadiah ini?')) return;

        setRedeeming(rewardId);
        try {
            const res = await fetch('/api/shop/loyalty/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rewardId }),
            });

            if (res.ok) {
                await refreshCustomer();
                await fetchLoyaltyData();
                setActiveTab('VOUCHERS');
                alert('Poin berhasil ditukarkan! Cek menu Voucer Saya.');
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menukarkan poin');
            }
        } catch (error) {
            alert('Terjadi kesalahan');
        } finally {
            setRedeeming(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Kode voucer disalin!');
    };

    if (authLoading || (isAuthenticated && loading)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    }

    const currentTier = (customer?.tier as keyof typeof TIERS) || 'BRONZE';
    const tierData = TIERS[currentTier];
    const nextTier = tierData.next ? TIERS[tierData.next as keyof typeof TIERS] : null;
    const progress = nextTier
        ? Math.min(100, (totalSpent / nextTier.minSpent) * 100)
        : 100;

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            {/* Header */}
            <div className="bg-white px-4 py-4 sticky top-0 z-30 flex items-center gap-4 border-b border-stone-100">
                <button onClick={() => router.back()} className="p-2 hover:bg-stone-50 rounded-full">
                    <ChevronLeft size={24} className="text-stone-600" />
                </button>
                <h1 className="text-lg font-bold text-stone-900">Pasarantar Loyalty</h1>
            </div>

            {/* Loyalty Card */}
            <div className="px-4 mt-6">
                <div className="bg-stone-900 rounded-3xl p-6 relative overflow-hidden ring-1 ring-white/10">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Total Poin Anda</p>
                                <div className="flex items-center gap-2">
                                    <Star className="text-yellow-400 fill-yellow-400" size={20} />
                                    <span className="text-3xl font-bold text-white tracking-tight">{customer?.points || 0}</span>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full ${tierData.bg} ${tierData.color} text-[10px] font-bold uppercase tracking-wider border border-white/10`}>
                                {tierData.name} Member
                            </div>
                        </div>

                        {nextTier && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-end text-[10px] text-white/60 font-medium">
                                    <span>Progress ke {nextTier.name}</span>
                                    <span>Tier Perks: {nextTier.name === 'SILVER' ? '1.2x Poin' : '1.5x Poin'}</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex px-4 mt-8 gap-2 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveTab('REWARDS')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all
                        ${activeTab === 'REWARDS' ? 'bg-orange-500 text-white' : 'bg-white text-stone-500 border border-stone-200'}`}
                >
                    Tukar Hadiah
                </button>
                <button
                    onClick={() => setActiveTab('VOUCHERS')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all
                        ${activeTab === 'VOUCHERS' ? 'bg-orange-500 text-white' : 'bg-white text-stone-500 border border-stone-200'}`}
                >
                    Voucer Saya ({vouchers.length})
                </button>
                <button
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all
                        ${activeTab === 'HISTORY' ? 'bg-orange-500 text-white' : 'bg-white text-stone-500 border border-stone-200'}`}
                >
                    Riwayat
                </button>
            </div>

            {/* Content Section */}
            <div className="px-4 mt-6">
                {activeTab === 'REWARDS' && (
                    <div className="grid grid-cols-1 gap-4">
                        {rewards.length === 0 ? (
                            <div className="py-12 text-center bg-white rounded-3xl border border-stone-100">
                                <Gift className="mx-auto text-stone-200 mb-3" size={48} />
                                <p className="text-stone-400 text-sm font-medium">Tidak ada hadiah tersedia saat ini.</p>
                            </div>
                        ) : (
                            rewards.map((reward) => (
                                <div key={reward.id} className="bg-white rounded-3xl p-4 flex gap-4 border border-stone-200 hover:border-orange-500 transition-colors">
                                    <div className="relative size-24 rounded-2xl bg-stone-50 overflow-hidden flex-shrink-0">
                                        {reward.image ? (
                                            <Image src={reward.image} alt={reward.title} fill className="object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-stone-300">
                                                <Gift size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-stone-900 text-sm leading-tight mb-1">{reward.title}</h3>
                                            <p className="text-[11px] text-stone-500 line-clamp-2">{reward.description}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-orange-600 font-bold text-sm">
                                                <Star className="fill-orange-500" size={14} />
                                                {reward.pointsCost}
                                            </div>
                                            <button
                                                onClick={() => handleRedeem(reward.id)}
                                                disabled={redeeming === reward.id || (customer?.points || 0) < reward.pointsCost}
                                                className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all
                                                    ${(customer?.points || 0) >= reward.pointsCost
                                                        ? 'bg-orange-500 text-white active:scale-95'
                                                        : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}
                                            >
                                                {redeeming === reward.id ? <Loader2 size={14} className="animate-spin" /> : 'TUKAR'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'VOUCHERS' && (
                    <div className="space-y-4">
                        {vouchers.length === 0 ? (
                            <div className="py-12 text-center bg-white rounded-3xl border border-stone-100">
                                <Award className="mx-auto text-stone-200 mb-3" size={48} />
                                <p className="text-stone-400 text-sm font-medium">Kamu belum punya voucer aktif.</p>
                                <button onClick={() => setActiveTab('REWARDS')} className="text-orange-500 text-xs font-bold mt-2 hover:underline">
                                    Tukarkan poin sekarang
                                </button>
                            </div>
                        ) : (
                            vouchers.map((voucher) => (
                                <div key={voucher.id} className="bg-white rounded-3xl p-5 border-2 border-dashed border-stone-200 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                                                {voucher.type === 'PRODUCT' ? 'Hadiah Produk' : voucher.type === 'SHIPPING' ? 'Gratis Ongkir' : 'Diskon Belanja'}
                                            </span>
                                            <h4 className="font-bold text-stone-900 leading-tight">
                                                {voucher.type === 'PRODUCT' ? `Gratis ${voucher.product?.name}` : `Potongan Rp ${Number(voucher.value).toLocaleString('id-ID')}`}
                                            </h4>
                                        </div>
                                        <Award size={24} className="text-stone-300 group-hover:rotate-12 transition-transform" />
                                    </div>

                                    <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                                        <code className="flex-1 text-sm font-bold text-stone-800 tracking-wider">
                                            {voucher.code}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(voucher.code)}
                                            className="p-2 hover:bg-white rounded-lg transition-colors text-orange-500"
                                        >
                                            <Copy size={18} />
                                        </button>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-[10px] font-medium">
                                        <div className="flex items-center gap-1.5 text-stone-500">
                                            <Clock size={12} />
                                            Berlaku s/d {new Date(voucher.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                        <button
                                            onClick={() => router.push('/products')}
                                            className="text-orange-600 font-bold flex items-center gap-1 hover:underline"
                                        >
                                            PAKAI <ArrowRight size={12} />
                                        </button>
                                    </div>

                                    {/* Notch Cutouts */}
                                    <div className="absolute top-1/2 -left-3 size-6 bg-stone-50 rounded-full border border-stone-100 -translate-y-1/2"></div>
                                    <div className="absolute top-1/2 -right-3 size-6 bg-stone-50 rounded-full border border-stone-100 -translate-y-1/2"></div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'HISTORY' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden px-2">
                        {history.length === 0 ? (
                            <div className="py-12 text-center italic text-stone-400 text-sm">Belum ada riwayat poin.</div>
                        ) : (
                            history.map((tx, index) => (
                                <div key={tx.id} className={`py-4 px-4 flex items-center justify-between ${index !== history.length - 1 ? 'border-b border-stone-50' : ''}`}>
                                    <div>
                                        <p className="text-sm font-bold text-stone-900 leading-tight">{tx.description}</p>
                                        <p className="text-[10px] text-stone-400 mt-0.5">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="px-4 mt-8">
                <div className="bg-blue-50/50 rounded-3xl p-5 border border-blue-100 flex gap-4">
                    <div className="size-10 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Info size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-900 mb-1">Butuh Bantuan?</h4>
                        <p className="text-[11px] text-blue-700/80 leading-relaxed">
                            Setiap belanja Rp 10.000 kamu akan mendapatkan 1 Poin (Poin dasar). Tingkatkan tier kamu ke Silver atau Gold untuk mendapatkan multiplier poin lebih besar!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
