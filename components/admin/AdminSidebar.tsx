'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { ViewState } from '@/lib/types';
import {
    LayoutDashboard, List, BrainCircuit, ShoppingCart, Package,
    Users as UsersIcon, Image as ImageIcon, Download, PieChart,
    Calculator, LogOut, UserCog, User as UserIcon, Settings, Tags, Gift,
    MessageSquare, Smartphone, BookOpen, Bell, Scale
} from 'lucide-react';
import { AdminNotificationBell } from './AdminNotificationBell';

interface AdminSidebarProps {
    view: ViewState;
    setView: (view: ViewState) => void;
    isAdmin: boolean;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    onBackup: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    view,
    setView,
    isAdmin,
    mobileMenuOpen,
    setMobileMenuOpen,
    onBackup,
}) => {
    const handleNav = (newView: ViewState) => {
        setView(newView);
        setMobileMenuOpen(false);
    };

    const NavButton = ({ targetView, icon: Icon, label }: { targetView: ViewState; icon: React.ComponentType<{ size?: number }>; label: string }) => (
        <button
            onClick={() => handleNav(targetView)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === targetView
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );

    const SectionLabel = ({ children }: { children: React.ReactNode }) => (
        <div className="text-xs font-medium text-slate-400 px-4 mb-2 mt-4 uppercase tracking-wider">
            {children}
        </div>
    );

    return (
        <aside className={`
            fixed lg:sticky top-0 left-0 h-screen
            w-64 bg-white text-slate-800 flex-shrink-0
            border-r border-slate-200 shadow-lg lg:shadow-sm
            flex flex-col justify-between
            z-50 lg:z-auto
            transform transition-transform duration-300 ease-in-out
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:top-0
        `}>
            {/* Logo Header - Fixed */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg shadow-sm flex items-center justify-center">
                        <span className="text-white font-semibold text-lg tracking-tight">PA</span>
                    </div>
                    <div>
                        <h1 className="font-semibold text-lg leading-none text-slate-900">Pasarantar</h1>
                        <span className="text-xs text-slate-500">Keuangan & Stok</span>
                    </div>
                </div>
                <div className="hidden lg:block">
                    <AdminNotificationBell onViewOrder={() => handleNav('ORDERS')} />
                </div>
            </div>

            {/* Scrollable Navigation */}
            <nav className="p-4 space-y-2 overflow-y-auto flex-1 hide-scrollbar">
                <SectionLabel>Utama</SectionLabel>
                <NavButton targetView="DASHBOARD" icon={LayoutDashboard} label="Ringkasan" />
                <NavButton targetView="ORDERS" icon={ShoppingCart} label="Pesanan" />

                <SectionLabel>Manajemen</SectionLabel>
                <NavButton targetView="PRODUCTS" icon={Package} label="Data Produk" />
                <NavButton targetView="HPP_CALCULATOR" icon={Calculator} label="Kalkulator HPP" />
                <NavButton targetView="CUSTOMERS" icon={UsersIcon} label="Pelanggan" />
                <button
                    onClick={() => handleNav('SHOP_SETTINGS')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'SHOP_SETTINGS'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                >
                    <Settings className="text-orange-500" size={20} />
                    <span>Pengaturan Toko</span>
                </button>
                <NavButton targetView="NOTIFICATIONS" icon={Bell} label="Wa Notifikasi" />

                <SectionLabel>Keuangan</SectionLabel>
                <NavButton targetView="TRANSACTIONS" icon={List} label="Buku Transaksi" />
                <NavButton targetView="REPORTS" icon={PieChart} label="Laporan Laba Rugi" />

                {isAdmin && (
                    <>
                        <SectionLabel>Admin</SectionLabel>
                        <NavButton targetView="BANNER_MANAGEMENT" icon={ImageIcon} label="Banner Promo" />
                        <NavButton targetView="CATEGORY_MANAGEMENT" icon={Tags} label="Kategori Produk" />
                        <NavButton targetView="UNIT_MANAGEMENT" icon={Scale} label="Manajemen Unit" />
                        <NavButton targetView="RECIPE_MANAGEMENT" icon={BookOpen} label="Manajemen Resep" />
                        <NavButton targetView="LOYALTY_MANAGEMENT" icon={Gift} label="Loyalty & Poin" />
                        <NavButton targetView="GOWA_SETTINGS" icon={Smartphone} label="WhatsApp (GOWA)" />
                        <NavButton targetView="USER_MANAGEMENT" icon={UserCog} label="User Management" />
                    </>
                )}

                <SectionLabel>Account</SectionLabel>
                <NavButton targetView="PROFILE" icon={UserIcon} label="Profile" />

                <SectionLabel>Insight</SectionLabel>
                <NavButton targetView="ANALYSIS" icon={BrainCircuit} label="Analisis Bisnis" />
                <NavButton targetView="CHAT_LOGS" icon={MessageSquare} label="Chat Logs AI" />
            </nav>

            {/* Footer - Fixed */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2 flex-shrink-0">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 hover:bg-rose-100 text-sm transition-colors font-medium"
                >
                    <LogOut size={16} /> Logout
                </button>
                <button
                    onClick={onBackup}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 text-sm transition-colors"
                >
                    <Download size={16} /> Backup Data
                </button>
                <p className="text-xs text-slate-400 text-center mt-3">
                    © 2024 Pasarantar v2.0
                </p>
            </div>
        </aside>
    );
};
