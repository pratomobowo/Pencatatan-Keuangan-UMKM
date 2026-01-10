'use client';

import React from 'react';

// Tab ID type
export type TabId = 'store' | 'contact' | 'shipping' | 'payment' | 'hours' | 'faq' | 'popup';

// Shop Config State Interface
export interface ShopConfigState {
    // Store Info (Tab 1)
    storeName: string;
    storeTagline: string;
    storeLogo: string | null;
    storeDescription: string | null;

    // Contact & Location (Tab 2)
    contactInfo: {
        whatsapp: string;
        email: string;
        address: string;
    };
    storeLatitude: number | null;
    storeLongitude: number | null;
    googleMapsUrl: string | null;

    // Shipping (Tab 3)
    pricePerKm: number;
    baseShippingFee: number;
    maxDeliveryDistance: number;
    freeShippingMinimum: number;
    minimumOrder: number;
    serviceFee: number;

    // Payment (Tab 4)
    paymentMethods: { name: string; details: string; icon: string }[];
    qrisImage: string | null;

    // Operational Hours (Tab 5)
    operationalHours: Record<string, { open: string; close: string; isOpen: boolean }>;
    holidayMode: boolean;
    holidayMessage: string | null;

    // FAQ (Tab 6)
    faq: { question: string; answer: string }[];

    // Marketing Popup (Tab 7)
    popupEnabled: boolean;
    popupImage: string | null;
    popupTitle: string | null;
    popupLink: string | null;
    popupShowOnce: boolean;
    popupDelay: number;
}

// Common props for all tab components
export interface TabProps {
    config: ShopConfigState;
    setConfig: React.Dispatch<React.SetStateAction<ShopConfigState>>;
}

// Default operational hours
export const defaultOperationalHours = {
    monday: { open: '08:00', close: '17:00', isOpen: true },
    tuesday: { open: '08:00', close: '17:00', isOpen: true },
    wednesday: { open: '08:00', close: '17:00', isOpen: true },
    thursday: { open: '08:00', close: '17:00', isOpen: true },
    friday: { open: '08:00', close: '17:00', isOpen: true },
    saturday: { open: '08:00', close: '15:00', isOpen: true },
    sunday: { open: '', close: '', isOpen: false },
};

// Day names in Indonesian
export const dayNames: Record<string, string> = {
    monday: 'Senin',
    tuesday: 'Selasa',
    wednesday: 'Rabu',
    thursday: 'Kamis',
    friday: 'Jumat',
    saturday: 'Sabtu',
    sunday: 'Minggu',
};
