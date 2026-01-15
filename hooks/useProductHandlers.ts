import { Product } from '@/lib/types';
import { productsAPI } from '@/lib/api';

interface UseProductHandlersProps {
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    toast: { success: (msg: string) => void; error: (msg: string) => void };
}

export function useProductHandlers({ setProducts, toast }: UseProductHandlersProps) {

    const addProduct = async (product: Product) => {
        try {
            const newProduct = await productsAPI.create(product);
            setProducts(prev => [...prev, newProduct]);
            toast.success('Produk berhasil ditambahkan');
        } catch (error) {
            console.error('Failed to add product:', error);
            toast.error('Gagal menambah produk');
        }
    };

    const updateProduct = async (product: Product) => {
        try {
            const updatedProduct = await productsAPI.update(product.id, product);
            setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
            toast.success('Produk berhasil diupdate');
        } catch (error) {
            console.error('Failed to update product:', error);
            toast.error('Gagal mengupdate produk');
        }
    };

    const deleteProduct = async (id: string) => {
        if (confirm('Hapus produk ini?')) {
            try {
                await productsAPI.delete(id);
                setProducts(prev => prev.filter(p => p.id !== id));
                toast.success('Produk berhasil dihapus');
            } catch (error) {
                console.error('Failed to delete product:', error);
                toast.error('Gagal menghapus produk');
            }
        }
    };

    return { addProduct, updateProduct, deleteProduct };
}
