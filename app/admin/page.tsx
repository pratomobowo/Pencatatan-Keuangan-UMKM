'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import App from '@/components/App';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>}>
            <App />
        </Suspense>
    );
}
