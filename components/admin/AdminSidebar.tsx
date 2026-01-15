'use client';

import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { ViewState } from '@/lib/types';
import {
    LayoutDashboard, List, BrainCircuit, ShoppingCart, Package,
    Users as UsersIcon, Image as ImageIcon, Download, PieChart,
    Calculator, LogOut, UserCog, User as UserIcon, Settings, Tags, Gift,
    MessageSquare, Smartphone, BookOpen, Bell, Scale,
    ChevronDown, ChevronRight, Store, FileText
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

// Menu Item Definition
type IconType = React.ComponentType<{ size?: number; className?: string }>;

interface MenuItem {
    label: string;
    icon: IconType;
    view?: ViewState;      // If it's a link
    submenu?: MenuItem[];  // If it's a group
    adminOnly?: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    view,
    setView,
    isAdmin,
    mobileMenuOpen,
    setMobileMenuOpen,
    onBackup,
}) => {
    // State to track which menus are expanded
    // Initialize open based on current view
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    useEffect(() => {
        // Find which parent menu contains the current view and open it
        const parentLabel = findParentLabel(MENU_STRUCTURE, view);
        if (parentLabel && !expandedMenus.includes(parentLabel)) {
            setExpandedMenus(prev => [...prev, parentLabel]);
        }
    }, [view]);

    const handleNav = (newView: ViewState) => {
        setView(newView);
        setMobileMenuOpen(false); // Close mobile menu on click
    };

    const toggleMenu = (label: string) => {
        setExpandedMenus(prev =>
            prev.includes(label)
                ? prev.filter(l => l !== label)
                : [...prev, label]
        );
    };

    // Helper to find parent of current view
    const findParentLabel = (items: MenuItem[], targetView: ViewState): string | null => {
        for (const item of items) {
            if (item.submenu) {
                // Check if any child matches
                if (item.submenu.some(child => child.view === targetView)) {
                    return item.label;
                }
            }
        }
        return null;
    };

    // MENU CONFIGURATION
    const MENU_STRUCTURE: MenuItem[] = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            view: 'DASHBOARD'
        },
        {
            label: 'Pesanan',
            icon: ShoppingCart,
            submenu: [
                { label: 'Pesanan Masuk', icon: ShoppingCart, view: 'ORDERS' },
                { label: 'Riwayat Transaksi', icon: List, view: 'TRANSACTIONS' },
            ]
        },
        {
            label: 'Katalog',
            icon: Package,
            submenu: [
                { label: 'Daftar Produk', icon: Package, view: 'PRODUCTS' },
                { label: 'Kategori', icon: Tags, view: 'CATEGORY_MANAGEMENT', adminOnly: true },
                { label: 'Satuan Unit', icon: Scale, view: 'UNIT_MANAGEMENT', adminOnly: true },
                { label: 'Resep Makanan', icon: BookOpen, view: 'RECIPE_MANAGEMENT', adminOnly: true },
                { label: 'Kalkulator HPP', icon: Calculator, view: 'HPP_CALCULATOR' },
            ]
        },
        {
            label: 'Pelanggan',
            icon: UsersIcon,
            submenu: [
                { label: 'Data Pelanggan', icon: UsersIcon, view: 'CUSTOMERS' },
                { label: 'Loyalty & Poin', icon: Gift, view: 'LOYALTY_MANAGEMENT', adminOnly: true },
            ]
        },
        {
            label: 'Marketing',
            icon: Store,
            submenu: [
                { label: 'Banner Promo', icon: ImageIcon, view: 'BANNER_MANAGEMENT', adminOnly: true },
                { label: 'WA Notifikasi', icon: Bell, view: 'NOTIFICATIONS' },
            ]
        },
        {
            label: 'Laporan',
            icon: PieChart,
            submenu: [
                { label: 'Laba Rugi', icon: FileText, view: 'REPORTS' },
                { label: 'Analisis Bisnis', icon: BrainCircuit, view: 'ANALYSIS' },
            ]
        },
        {
            label: 'Pengaturan',
            icon: Settings,
            submenu: [
                { label: 'Profil Saya', icon: UserIcon, view: 'PROFILE' },
                { label: 'Pengaturan Toko', icon: Settings, view: 'SHOP_SETTINGS' },
                { label: 'WhatsApp (GOWA)', icon: Smartphone, view: 'GOWA_SETTINGS', adminOnly: true },
                { label: 'User Management', icon: UserCog, view: 'USER_MANAGEMENT', adminOnly: true },
                { label: 'Chat Logs AI', icon: MessageSquare, view: 'CHAT_LOGS' },
            ]
        }
    ];

    const renderMenuItem = (item: MenuItem) => {
        // Permission Check
        if (item.adminOnly && !isAdmin) return null;

        const isExpanded = expandedMenus.includes(item.label);
        const Icon = item.icon;

        // Is it a direct link?
        if (!item.submenu) {
            const isActive = view === item.view;
            return (
                <button
                    key={item.label}
                    onClick={() => item.view && handleNav(item.view)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium
                        ${isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                >
                    <Icon size={18} />
                    <span>{item.label}</span>
                </button>
            );
        }

        // It is a submenu group
        // Check if any child matches permission (don't show empty groups)
        const visibleChildren = item.submenu.filter(child => !child.adminOnly || isAdmin);
        if (visibleChildren.length === 0) return null;

        const isChildActive = item.submenu.some(child => child.view === view);

        return (
            <div key={item.label} className="space-y-1">
                <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors text-sm font-medium
                        ${isChildActive
                            ? 'text-blue-700 bg-blue-50'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <Icon size={18} className={isChildActive ? 'text-blue-600' : 'text-slate-500'} />
                        <span>{item.label}</span>
                    </div>
                    {isExpanded ? (
                        <ChevronDown size={14} className="text-slate-400" />
                    ) : (
                        <ChevronRight size={14} className="text-slate-400" />
                    )}
                </button>

                {/* Submenu Items */}
                {isExpanded && (
                    <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        <div className="border-l-2 border-slate-100 pl-3 space-y-1 my-1">
                            {visibleChildren.map((child) => {
                                const ChildIcon = child.icon;
                                const isItemActive = view === child.view;
                                return (
                                    <button
                                        key={child.label}
                                        onClick={() => child.view && handleNav(child.view)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                                            ${isItemActive
                                                ? 'bg-blue-100 text-blue-700 font-medium'
                                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${isItemActive ? 'bg-blue-600' : 'bg-slate-300'}`} />
                                        <span>{child.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className={`
            fixed lg:sticky top-0 left-0 h-screen
            w-64 bg-white text-slate-800 flex-shrink-0
            border-r border-slate-200 shadow-xl lg:shadow-sm
            flex flex-col justify-between
            z-50 lg:z-auto
            transform transition-transform duration-300 ease-in-out
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:top-0
        `}>
            {/* Logo Header - Fixed */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100 flex-shrink-0 h-[88px]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center transform hover:scale-105 transition-transform">
                        <span className="text-white font-bold text-lg tracking-tight">PA</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-none text-slate-900">Pasarantar</h1>
                        <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded-full mt-1 inline-block">Admin Panel</span>
                    </div>
                </div>
            </div>

            {/* Scrollable Navigation */}
            <nav className="p-4 space-y-1 overflow-y-auto flex-1 hide-scrollbar">
                {MENU_STRUCTURE.map(item => renderMenuItem(item))}
            </nav>

            {/* Footer - Fixed */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2 flex-shrink-0">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-rose-200 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold transition-all shadow-sm"
                >
                    <LogOut size={14} /> Keluar
                </button>
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={onBackup}
                        className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                        title="Backup Database"
                    >
                        <Download size={10} /> Backup
                    </button>
                    <span className="text-[10px] text-slate-300">•</span>
                    <p className="text-[10px] text-slate-400">
                        v2.1
                    </p>
                </div>
            </div>

            {/* Close Button Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1] lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </aside>
    );
};
