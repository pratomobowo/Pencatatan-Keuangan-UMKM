import { Order, Product, ShopOrderStatus } from '@/lib/types';
import { ordersAPI, productsAPI, customersAPI, transactionsAPI } from '@/lib/api';

interface UseOrderHandlersProps {
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
    setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useOrderHandlers({
    setOrders,
    setProducts,
    setCustomers,
    setTransactions,
}: UseOrderHandlersProps) {

    const addOrder = async (order: Order) => {
        try {
            const newOrder = await ordersAPI.create(order);
            setOrders(prev => [...prev, newOrder]);
            // Refresh products to get updated stock
            const updatedProducts = await productsAPI.getAll();
            setProducts(updatedProducts);
        } catch (error) {
            console.error('Failed to add order:', error);
            alert('Gagal menambah order');
        }
    };

    const updateOrderStatus = async (
        id: string,
        status: 'PAID' | 'CANCELLED' | ShopOrderStatus,
        orders: Order[]
    ) => {
        const orderToUpdate = orders.find(o => o.id === id);
        if (!orderToUpdate) return;

        const confirmMessage = status === 'CANCELLED'
            ? 'Batalkan order ini? Stok produk akan dikembalikan otomatis.'
            : `Ubah status order ini menjadi ${status}?`;

        if (confirm(confirmMessage)) {
            try {
                await ordersAPI.updateStatus(id, status);
                // Refresh all data to get updated values
                const [updatedOrders, updatedProducts, updatedCustomers, updatedTransactions] = await Promise.all([
                    ordersAPI.getAll(),
                    productsAPI.getAll(),
                    customersAPI.getAll(),
                    transactionsAPI.getAll(),
                ]);
                setOrders(updatedOrders);
                setProducts(updatedProducts);
                setCustomers(updatedCustomers);
                setTransactions(updatedTransactions);

                if (status === 'PAID') {
                    alert('Order dilunasi! Transaksi dicatat dan total belanja pelanggan diupdate.');
                }
            } catch (error) {
                console.error('Failed to update order status:', error);
                alert('Gagal mengupdate status order');
            }
        }
    };

    const deleteOrder = async (id: string) => {
        if (confirm('Hapus order ini? Jika order belum dibatalkan, Stok akan dikembalikan.')) {
            try {
                await ordersAPI.delete(id);
                setOrders(prev => prev.filter(o => o.id !== id));
                // Refresh products to get updated stock
                const updatedProducts = await productsAPI.getAll();
                setProducts(updatedProducts);
            } catch (error) {
                console.error('Failed to delete order:', error);
                alert('Gagal menghapus order');
            }
        }
    };

    const deleteBulkOrders = async (ids: string[]) => {
        try {
            await ordersAPI.deleteBulk(ids);
            setOrders(prev => prev.filter(o => !ids.includes(o.id)));
            // Refresh products to get updated stock
            const updatedProducts = await productsAPI.getAll();
            setProducts(updatedProducts);
        } catch (error) {
            console.error('Failed to delete bulk orders:', error);
            alert('Gagal menghapus beberapa order');
        }
    };

    const updateOrder = async (order: Order) => {
        try {
            const updatedOrder = await ordersAPI.update(order.id, order);
            setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
            // Refresh products to get updated stock
            const updatedProducts = await productsAPI.getAll();
            setProducts(updatedProducts);
            alert('Pesanan berhasil diupdate!');
        } catch (error) {
            console.error('Failed to update order:', error);
            alert('Gagal mengupdate order');
        }
    };

    return { addOrder, updateOrder, updateOrderStatus, deleteOrder, deleteBulkOrders };
}
