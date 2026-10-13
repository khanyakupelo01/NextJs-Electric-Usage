import TransactionsDashboard from "@/features/transactions/components/TransactionsDashboard";

export default function Home({ currentUser }) {
  return <TransactionsDashboard userId={currentUser?.id} />;
}
