'use client';

import { useEffect, useState } from 'react';

export default function AdminUserCartsPage() {
  const [carts, setCarts] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const q = status ? `?status=${status}` : '';
    fetch(`/api/admin/users/carts${q}`).then((r) => r.json()).then((j) => setCarts(j.data || []));
  }, [status]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Carts</h1>
      <select className="border p-2 mb-4 rounded" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="abandoned">Abandoned</option>
        <option value="converted">Converted</option>
      </select>
      <table className="w-full border text-sm">
        <thead><tr className="bg-gray-100"><th className="p-2 text-left">User</th><th className="p-2">Status</th><th className="p-2">Items</th><th className="p-2">Subtotal</th></tr></thead>
        <tbody>
          {carts.map((c) => (
            <tr key={c._id} className="border-t">
              <td className="p-2">{c.userId?.phone || c.userId?.name || c.userId}</td>
              <td className="p-2 text-center">{c.status}</td>
              <td className="p-2 text-center">{c.items?.length || 0}</td>
              <td className="p-2 text-center">₹{c.subtotal || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
