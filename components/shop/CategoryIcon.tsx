'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface CategoryIconProps {
    name: string;
    icon: LucideIcon;
    href: string;
    color: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, icon: Icon, href, color }) => {
    return (
        <Link href={href} className="flex flex-col items-center gap-2 group">
            <div className={`size-16 rounded-2xl bg-white shadow-sm border border-orange-50 flex items-center justify-center group-active:scale-95 transition-transform`}>
                <Icon className={color} size={32} />
            </div>
            <span className="text-xs font-medium text-stone-900 text-center">{name}</span>
        </Link>
    );
};
