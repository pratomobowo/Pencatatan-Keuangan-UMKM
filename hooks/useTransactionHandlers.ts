import { Transaction } from '@/lib/types';
import { transactionsAPI } from '@/lib/api';

interface UseTransactionHandlersProps {
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    toast: { success: (msg: string) => void; error: (msg: string) => void };
}

export function useTransactionHandlers({ setTransactions, toast }: UseTransactionHandlersProps) {

    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        try {
            const newTransaction = await transactionsAPI.create(transaction);
            setTransactions(prev => [newTransaction, ...prev]);
            toast.success('Transaksi berhasil ditambahkan');
        } catch (error) {
            console.error('Failed to add transaction:', error);
            toast.error('Gagal menambah transaksi');
        }
    };

    const deleteTransaction = async (id: string) => {
        if (confirm('Hapus transaksi ini?')) {
            try {
                await transactionsAPI.delete(id);
                setTransactions(prev => prev.filter(t => t.id !== id));
                toast.success('Transaksi berhasil dihapus');
            } catch (error) {
                console.error('Failed to delete transaction:', error);
                toast.error('Gagal menghapus transaksi');
            }
        }
    };

    return { addTransaction, deleteTransaction };
}
