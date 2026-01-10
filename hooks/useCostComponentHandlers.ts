import { CostComponent } from '@/lib/types';
import { costComponentsAPI } from '@/lib/api';

interface UseCostComponentHandlersProps {
    setCostComponents: React.Dispatch<React.SetStateAction<CostComponent[]>>;
    toast: { success: (msg: string) => void; error: (msg: string) => void };
}

export function useCostComponentHandlers({ setCostComponents, toast }: UseCostComponentHandlersProps) {

    const addCostComponent = async (cost: CostComponent) => {
        try {
            const newCost = await costComponentsAPI.create(cost);
            setCostComponents(prev => [...prev, newCost]);
            toast.success('Komponen biaya berhasil ditambahkan');
        } catch (error) {
            console.error('Failed to add cost component:', error);
            toast.error('Gagal menambah komponen biaya');
        }
    };

    const deleteCostComponent = async (id: string) => {
        if (confirm('Hapus komponen biaya ini?')) {
            try {
                await costComponentsAPI.delete(id);
                setCostComponents(prev => prev.filter(c => c.id !== id));
                toast.success('Komponen biaya berhasil dihapus');
            } catch (error) {
                console.error('Failed to delete cost component:', error);
                toast.error('Gagal menghapus komponen biaya');
            }
        }
    };

    return { addCostComponent, deleteCostComponent };
}
