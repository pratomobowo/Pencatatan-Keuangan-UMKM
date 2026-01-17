'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import App from '@/components/App';
import { Loader2, ShieldX } from 'lucide-react';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin-login');
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

    // Check if user has admin or user role (not customer/shop user)
    const userRole = (session.user as any)?.role;
    const isAdminOrUser = userRole === 'admin' || userRole === 'user';

    if (!isAdminOrUser) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <ShieldX className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Akses Ditolak</h1>
                    <p className="text-slate-600 mb-6">
                        Anda tidak memiliki izin untuk mengakses halaman admin.
                        Silakan login dengan akun admin.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/')}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Ke Beranda
                        </button>
                        <button
                            onClick={() => router.push('/admin-login')}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Login Admin
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>}>
            <App />
        </Suspense>
    );
}
