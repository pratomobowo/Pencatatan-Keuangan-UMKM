import { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, FinancialSummary, Order, Product, Customer, CostComponent, User } from '@/lib/types';
import { productsAPI, customersAPI, ordersAPI, transactionsAPI, costComponentsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export interface AdminDataReturn {
    // Data
    transactions: Transaction[];
    orders: Order[];
    products: Product[];
    customers: Customer[];
    costComponents: CostComponent[];
    users: User[];
    loading: boolean;

    // Setters
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    setCostComponents: React.Dispatch<React.SetStateAction<CostComponent[]>>;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;

    // Computed
    summary: FinancialSummary;
}

export function useAdminData(isAdmin: boolean): AdminDataReturn {
    const toast = useToast();

    // State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [costComponents, setCostComponents] = useState<CostComponent[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Load from API on Mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const results = await Promise.allSettled([
                    transactionsAPI.getAll(),
                    ordersAPI.getAll(),
                    productsAPI.getAll(),
                    customersAPI.getAll(),
                    costComponentsAPI.getAll(),
                ]);

                const handleResult = <T,>(result: PromiseSettledResult<T>, defaultValue: T, name: string) => {
                    if (result.status === 'fulfilled') return result.value;
                    console.error(`Failed to fetch ${name}:`, result.reason);
                    toast.error(`Gagal memuat ${name}`);
                    return defaultValue;
                };

                setTransactions(handleResult(results[0], [], 'Data Transaksi'));
                setOrders(handleResult(results[1], [], 'Data Pesanan'));
                setProducts(handleResult(results[2], [], 'Data Produk'));
                setCustomers(handleResult(results[3], [], 'Data Pelanggan'));
                setCostComponents(handleResult(results[4], [], 'Data Biaya'));
            } catch (error) {
                console.error('Failed to fetch initial data:', error);
                toast.error('Gagal memuat data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fetch users if admin
    useEffect(() => {
        if (isAdmin) {
            fetch('/api/users')
                .then(res => res.json())
                .then(data => setUsers(data))
                .catch(error => {
                    console.error('Failed to fetch users:', error);
                });
        }
    }, [isAdmin]);

    // Derived Summary
    const summary: FinancialSummary = useMemo(() => {
        const totalIncome = transactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((acc, t) => acc + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => acc + t.amount, 0);

        const totalCapital = transactions
            .filter(t => t.type === TransactionType.CAPITAL)
            .reduce((acc, t) => acc + t.amount, 0);

        return {
            totalIncome,
            totalExpense,
            totalCapital,
            netProfit: totalIncome - totalExpense,
            balance: totalIncome - totalExpense,
        };
    }, [transactions]);

    return {
        transactions,
        orders,
        products,
        customers,
        costComponents,
        users,
        loading,
        setTransactions,
        setOrders,
        setProducts,
        setCustomers,
        setCostComponents,
        setUsers,
        summary,
    };
}
