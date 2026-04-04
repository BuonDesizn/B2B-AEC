// @witness [MON-001]
'use client';

import { useState, useEffect } from 'react';

interface Payment {
  created_at: string;
  user_id?: string;
  amount: number;
  type: string;
  status: string;
  phonepe_txn_id?: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/payments', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setPayments(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Payment History</h1>
        <p className="text-sm text-muted-foreground mt-1">All platform payment transactions</p>
      </div>
      {payments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No payment records found</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">PhonePe Txn ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: Payment, i: number) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-3">{p.user_id?.slice(0, 8)}</td>
                  <td className="p-3 font-medium">₹{p.amount?.toLocaleString('en-IN')}</td>
                  <td className="p-3">{p.type}</td>
                  <td className="p-3">{p.status}</td>
                  <td className="p-3 hidden md:table-cell font-mono text-xs">{p.phonepe_txn_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
