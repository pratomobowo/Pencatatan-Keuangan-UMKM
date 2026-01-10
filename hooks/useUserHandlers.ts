import { User } from '@/lib/types';

interface UseUserHandlersProps {
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    toast: { success: (msg: string) => void; error: (msg: string) => void };
}

export function useUserHandlers({ setUsers, toast }: UseUserHandlersProps) {

    const createUser = async (user: { email: string; name: string; password: string; role: string }) => {
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create user');
            }

            const newUser = await response.json();
            setUsers(prev => [...prev, newUser]);
            toast.success('User berhasil dibuat');
        } catch (error: any) {
            console.error('Failed to create user:', error);
            toast.error(error.message || 'Gagal membuat user');
            throw error;
        }
    };

    const updateUser = async (id: string, data: { email?: string; name?: string; role?: string; password?: string }) => {
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update user');
            }

            const updatedUser = await response.json();
            setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
            toast.success('User berhasil diupdate');
        } catch (error: any) {
            console.error('Failed to update user:', error);
            toast.error(error.message || 'Gagal mengupdate user');
            throw error;
        }
    };

    const deleteUser = async (id: string) => {
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete user');
            }

            setUsers(prev => prev.filter(u => u.id !== id));
            toast.success('User berhasil dihapus');
        } catch (error: any) {
            console.error('Failed to delete user:', error);
            toast.error(error.message || 'Gagal menghapus user');
            throw error;
        }
    };

    return { createUser, updateUser, deleteUser };
}
