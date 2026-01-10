import { Customer } from '@/lib/types';
import { customersAPI } from '@/lib/api';

interface UseCustomerHandlersProps {
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    toast: { success: (msg: string) => void; error: (msg: string) => void };
}

export function useCustomerHandlers({ setCustomers, toast }: UseCustomerHandlersProps) {

    const addCustomer = async (customer: Customer) => {
        try {
            const newCustomer = await customersAPI.create(customer);
            setCustomers(prev => [...prev, newCustomer]);
            toast.success('Pelanggan berhasil ditambahkan');
        } catch (error) {
            console.error('Failed to add customer:', error);
            toast.error('Gagal menambah pelanggan');
        }
    };

    const updateCustomer = async (id: string, customer: Customer) => {
        try {
            await customersAPI.update(customer.id, customer);
            setCustomers(prev => prev.map(c => c.id === id ? customer : c));
            toast.success('Pelanggan berhasil diupdate');
        } catch (error) {
            console.error('Failed to update customer:', error);
            toast.error('Gagal mengupdate pelanggan');
        }
    };

    const deleteCustomer = async (id: string) => {
        if (confirm('Hapus pelanggan ini?')) {
            try {
                await customersAPI.delete(id);
                setCustomers(prev => prev.filter(c => c.id !== id));
                toast.success('Pelanggan berhasil dihapus');
            } catch (error) {
                console.error('Failed to delete customer:', error);
                toast.error('Gagal menghapus pelanggan');
            }
        }
    };

    return { addCustomer, updateCustomer, deleteCustomer };
}
