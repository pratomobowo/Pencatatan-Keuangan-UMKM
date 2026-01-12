import { RecipeManager } from '@/components/admin/RecipeManager';

export default function AdminRecipesPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-stone-900 mb-6">Manajemen Buku Resep</h1>
            <RecipeManager />
        </div>
    );
}
