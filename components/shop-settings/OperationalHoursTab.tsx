'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { TabProps, dayNames } from './types';

export const OperationalHoursTab: React.FC<TabProps> = ({ config, setConfig }) => (
    <div className="space-y-6">
        <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Mode Libur</h3>
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-medium text-slate-800">Toko Sedang Libur</p>
                    <p className="text-xs text-slate-500">Aktifkan jika toko tutup sementara</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={config.holidayMode}
                        onChange={e => setConfig({ ...config, holidayMode: e.target.checked })}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
            {config.holidayMode && (
                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pesan Libur</label>
                    <input
                        type="text"
                        value={config.holidayMessage || ''}
                        onChange={e => setConfig({ ...config, holidayMessage: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Toko tutup untuk libur lebaran..."
                    />
                </div>
            )}
        </Card>

        <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Jam Operasional</h3>
            <div className="space-y-3">
                {Object.entries(config.operationalHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
                        <div className="w-24">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hours.isOpen}
                                    onChange={e => {
                                        const newHours = { ...config.operationalHours };
                                        newHours[day] = { ...hours, isOpen: e.target.checked };
                                        setConfig({ ...config, operationalHours: newHours });
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium">{dayNames[day] || day}</span>
                            </label>
                        </div>
                        {hours.isOpen ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    value={hours.open}
                                    onChange={e => {
                                        const newHours = { ...config.operationalHours };
                                        newHours[day] = { ...hours, open: e.target.value };
                                        setConfig({ ...config, operationalHours: newHours });
                                    }}
                                    className="p-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                    type="time"
                                    value={hours.close}
                                    onChange={e => {
                                        const newHours = { ...config.operationalHours };
                                        newHours[day] = { ...hours, close: e.target.value };
                                        setConfig({ ...config, operationalHours: newHours });
                                    }}
                                    className="p-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ) : (
                            <span className="text-sm text-slate-400">Tutup</span>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    </div>
);
