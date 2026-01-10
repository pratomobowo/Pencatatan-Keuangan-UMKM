'use client';

import React from 'react';
import { ViewState } from '@/lib/types';
import { LayoutDashboard, ShoppingCart, Package, List, Menu, X } from 'lucide-react';
import { AdminNotificationBell } from './AdminNotificationBell';

interface AdminMobileNavProps {
    view: ViewState;
    setView: (view: ViewState) => void;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
}

export const AdminMobileNav: React.FC<AdminMobileNavProps> = ({
    view,
    setView,
    mobileMenuOpen,
    setMobileMenuOpen,
}) => {
    const handleNav = (newView: ViewState) => {
        setView(newView);
        setMobileMenuOpen(false);
    };

    return (
        <>
            {/* Mobile Header with Hamburger */}
            <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg shadow-sm flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">PA</span>
                    </div>
                    <div>
                        <h1 className="font-semibold text-base leading-none text-slate-900">Pasarantar</h1>
                        <span className="text-[10px] text-slate-500">Admin Dashboard</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <AdminNotificationBell onViewOrder={() => handleNav('ORDERS')} />
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-pb">
                <div className="grid grid-cols-5 gap-1 px-2 py-2">
                    <button
                        onClick={() => handleNav('DASHBOARD')}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${view === 'DASHBOARD' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="text-[10px] mt-1 font-medium">Dashboard</span>
                    </button>
                    <button
                        onClick={() => handleNav('ORDERS')}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${view === 'ORDERS' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                    >
                        <ShoppingCart size={20} />
                        <span className="text-[10px] mt-1 font-medium">Pesanan</span>
                    </button>
                    <button
                        onClick={() => handleNav('PRODUCTS')}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${view === 'PRODUCTS' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                    >
                        <Package size={20} />
                        <span className="text-[10px] mt-1 font-medium">Produk</span>
                    </button>
                    <button
                        onClick={() => handleNav('TRANSACTIONS')}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${view === 'TRANSACTIONS' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                    >
                        <List size={20} />
                        <span className="text-[10px] mt-1 font-medium">Transaksi</span>
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors text-slate-600"
                    >
                        <Menu size={20} />
                        <span className="text-[10px] mt-1 font-medium">Menu</span>
                    </button>
                </div>
            </nav>
        </>
    );
};
