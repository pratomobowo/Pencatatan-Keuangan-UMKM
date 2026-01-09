'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LucideIcon } from 'lucide-react';

interface CategoryIconProps {
    name: string;
    icon?: LucideIcon;
    image?: string | null;
    href: string;
    color: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, icon: Icon, image, href, color }) => {
    return (
        <Link href={href} className="flex flex-col items-center gap-2 group">
            <div className={`size-16 rounded-2xl bg-white shadow-sm border border-orange-50 flex items-center justify-center group-active:scale-95 transition-transform overflow-hidden relative`}>
                {image ? (
                    <Image src={image} alt={name} fill className="object-contain p-2.5" />
                ) : Icon ? (
                    <Icon className={color} size={32} />
                ) : null}
            </div>
            <span className="text-[11px] font-bold text-stone-900 text-center leading-tight">{name}</span>
        </Link>
    );
};
