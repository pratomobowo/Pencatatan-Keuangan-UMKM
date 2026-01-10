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

const TIER_GROUPS = {
    BRONZE: { name: 'Bronze', color: 'text-orange-700', bg: 'bg-orange-100' },
    SILVER: { name: 'Silver', color: 'text-slate-500', bg: 'bg-slate-100' },
    GOLD: { name: 'Gold', color: 'text-yellow-600', bg: 'bg-yellow-100' },
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
    const [config, setConfig] = useState<any>(null);

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
            const [rewardsRes, profileRes, configRes] = await Promise.all([
                fetch('/api/shop/loyalty/rewards'),
                fetch('/api/shop/loyalty/profile'),
                fetch('/api/shop/loyalty/config')
            ]);

            if (rewardsRes.ok) setRewards(await rewardsRes.json());
            if (configRes.ok) setConfig(await configRes.json());
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

    const currentTier = (customer?.tier as keyof typeof TIER_GROUPS) || 'BRONZE';
    const tierData = TIER_GROUPS[currentTier];

    // Compute next tier based on config
    const nextTier = config ? (
        currentTier === 'BRONZE' ? { name: 'Silver', minSpent: config.minSpentSilver, id: 'SILVER' } :
            currentTier === 'SILVER' ? { name: 'Gold', minSpent: config.minSpentGold, id: 'GOLD' } :
                null
    ) : null;

    const progress = nextTier
        ? Math.min(100, (totalSpent / nextTier.minSpent) * 100)
        : 100;

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md px-4 py-4 sticky top-0 z-30 flex items-center gap-4 border-b border-stone-100">
                <button onClick={() => router.back()} className="p-2 hover:bg-stone-50 rounded-xl transition-colors">
                    <ChevronLeft size={24} className="text-stone-600" />
                </button>
                <h1 className="text-lg font-semibold text-stone-900 tracking-tight">Loyalty Program</h1>
            </div>

            {/* Loyalty Card */}
            <div className="px-4 mt-6">
                <div className="bg-stone-900 rounded-[32px] p-7 relative overflow-hidden shadow-2xl shadow-stone-200">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/5 rounded-full -ml-12 -mb-12 blur-2xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0,transparent_70%)]"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <p className="text-white/40 text-[10px] font-medium uppercase tracking-[0.2em] mb-2">Poin Terkumpul</p>
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                        <Star className="text-white fill-white" size={20} />
                                    </div>
                                    <span className="text-4xl font-semibold text-white tracking-tight leading-none">{customer?.points || 0}</span>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-2xl ${tierData.bg} ${tierData.color} text-[10px] font-semibold uppercase tracking-wider border border-white/5 backdrop-blur-sm`}>
                                {tierData.name} Member
                            </div>
                        </div>

                        {nextTier && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[11px] text-white/50 font-medium tracking-wide">Progress ke {nextTier.name}</span>
                                    <div className="flex items-center gap-2">
                                        <Award size={12} className="text-orange-400" />
                                        <span className="text-[11px] text-white/70 font-semibold">{nextTier.name === 'SILVER' ? '1.2x Poin' : '1.5x Poin'}</span>
                                    </div>
                                </div>
                                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden p-[2px] ring-1 ring-white/10">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex px-4 mt-10 gap-3 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveTab('REWARDS')}
                    className={`px-6 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300
                        ${activeTab === 'REWARDS' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'bg-white text-stone-500 border border-stone-100 hover:border-stone-200'}`}
                >
                    Tukar Hadiah
                </button>
                <button
                    onClick={() => setActiveTab('VOUCHERS')}
                    className={`px-6 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300
                        ${activeTab === 'VOUCHERS' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'bg-white text-stone-500 border border-stone-100 hover:border-stone-200'}`}
                >
                    Voucer Saya <span className="opacity-50 ml-1">({vouchers.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-6 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300
                        ${activeTab === 'HISTORY' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'bg-white text-stone-500 border border-stone-100 hover:border-stone-200'}`}
                >
                    Riwayat
                </button>
            </div>

            {/* Content Section */}
            <div className="px-4 mt-8">
                {activeTab === 'REWARDS' && (
                    <div className="grid grid-cols-1 gap-5">
                        {rewards.length === 0 ? (
                            <div className="py-16 text-center bg-white rounded-[32px] border border-stone-100">
                                <Gift className="mx-auto text-stone-100 mb-4" size={56} />
                                <p className="text-stone-400 text-sm font-medium">Tidak ada hadiah tersedia saat ini.</p>
                            </div>
                        ) : (
                            rewards.map((reward) => (
                                <div key={reward.id} className="bg-white rounded-[28px] p-4 flex gap-5 border border-stone-100 hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-300">
                                    <div className="relative size-24 rounded-[22px] bg-stone-50 overflow-hidden flex-shrink-0 ring-1 ring-stone-100">
                                        {reward.image ? (
                                            <Image src={reward.image} alt={reward.title} fill className="object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-stone-200">
                                                <Gift size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div className="space-y-1.5">
                                            <h3 className="font-semibold text-stone-900 text-[15px] leading-snug">{reward.title}</h3>
                                            <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2">{reward.description}</p>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-1.5 text-orange-600 font-semibold text-[15px]">
                                                <Star className="fill-orange-500" size={16} />
                                                {reward.pointsCost}
                                            </div>
                                            <button
                                                onClick={() => handleRedeem(reward.id)}
                                                disabled={redeeming === reward.id || (customer?.points || 0) < reward.pointsCost}
                                                className={`px-5 py-2 rounded-2xl text-[11px] font-semibold transition-all duration-300
                                                    ${(customer?.points || 0) >= reward.pointsCost
                                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 active:scale-95'
                                                        : 'bg-stone-50 text-stone-300 cursor-not-allowed'}`}
                                            >
                                                {redeeming === reward.id ? <Loader2 size={14} className="animate-spin" /> : 'Tukarkan'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'VOUCHERS' && (
                    <div className="space-y-5">
                        {vouchers.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-[32px] border border-stone-100">
                                <Award className="mx-auto text-stone-100 mb-4" size={56} />
                                <p className="text-stone-400 text-sm font-medium">Kamu belum punya voucer aktif.</p>
                                <button onClick={() => setActiveTab('REWARDS')} className="text-orange-500 text-[11px] font-semibold mt-3 hover:underline tracking-wide uppercase">
                                    Tukarkan poin sekarang
                                </button>
                            </div>
                        ) : (
                            vouchers.map((voucher) => (
                                <div key={voucher.id} className="bg-white rounded-[32px] p-6 border border-stone-100 shadow-sm relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-orange-400">
                                                {voucher.type === 'PRODUCT' ? 'Hadiah Produk' : voucher.type === 'SHIPPING' ? 'Gratis Ongkir' : 'Diskon Belanja'}
                                            </span>
                                            <h4 className="font-semibold text-stone-900 text-lg leading-tight">
                                                {voucher.type === 'PRODUCT' ? `Gratis ${voucher.product?.name}` : `Potongan Rp ${Number(voucher.value).toLocaleString('id-ID')}`}
                                            </h4>
                                        </div>
                                        <div className="size-12 rounded-2xl bg-stone-50 flex items-center justify-center border border-stone-100">
                                            <Award size={24} className="text-stone-300 group-hover:text-orange-400 group-hover:scale-110 transition-all duration-500" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-stone-50/50 p-4 rounded-[22px] border border-stone-100/50">
                                        <code className="flex-1 text-sm font-semibold text-stone-700 tracking-[0.2em]">
                                            {voucher.code}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(voucher.code)}
                                            className="p-2.5 hover:bg-white rounded-xl transition-all duration-300 text-orange-500 hover:shadow-sm"
                                        >
                                            <Copy size={20} />
                                        </button>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[11px] font-medium text-stone-400">
                                            <Clock size={14} className="text-stone-300" />
                                            Berlaku s/d {new Date(voucher.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                        <button
                                            onClick={() => router.push('/products')}
                                            className="px-4 py-1.5 bg-orange-50 rounded-xl text-orange-600 font-semibold text-[11px] flex items-center gap-1.5 hover:bg-orange-100 transition-colors"
                                        >
                                            PAKAI <ArrowRight size={13} />
                                        </button>
                                    </div>

                                    {/* Dotted Divider Style Elements */}
                                    <div className="absolute top-[calc(50%-10px)] -left-3 size-6 bg-stone-50 rounded-full border border-stone-100/50"></div>
                                    <div className="absolute top-[calc(50%-10px)] -right-3 size-6 bg-stone-50 rounded-full border border-stone-100/50"></div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'HISTORY' && (
                    <div className="bg-white rounded-[32px] border border-stone-100 overflow-hidden px-2 shadow-sm">
                        {history.length === 0 ? (
                            <div className="py-20 text-center italic text-stone-300 text-sm font-medium">Belum ada riwayat poin.</div>
                        ) : (
                            history.map((tx, index) => (
                                <div key={tx.id} className={`py-5 px-5 flex items-center justify-between ${index !== history.length - 1 ? 'border-b border-stone-50' : ''}`}>
                                    <div className="space-y-1">
                                        <p className="text-[13px] font-semibold text-stone-800 leading-snug">{tx.description}</p>
                                        <p className="text-[10px] text-stone-400 font-medium">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[13px] font-semibold ${tx.amount > 0 ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount} Poin
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="px-4 mt-12 mb-8">
                <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-[32px] p-6 border border-blue-100 flex gap-5">
                    <div className="size-11 rounded-2xl bg-blue-100/50 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-blue-200/50">
                        <Info size={22} className="text-blue-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-1.5">Informasi Poin</h4>
                        <p className="text-[11px] text-blue-800/60 leading-relaxed font-medium">
                            Setiap transaksi kelipatan <span className="text-blue-900 font-semibold">Rp {(config?.pointsPerAmount || 10000).toLocaleString('id-ID')}</span> akan mendapatkan 1 Poin dasar.
                            Upgrade tier Anda untuk klaim multiplier poin hingga <span className="text-blue-900 font-semibold">1.5x lebih banyak!</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
