'use client';

import { useEffect, useState } from 'react';

export default function AdminSlidesPage() {
  const [slides, setSlides] = useState([]);
  const [form, setForm] = useState({ title: '', imageUrl: '', navigationType: 'category', navigationTarget: '', ctaText: 'Book Now', isActive: true });

  const load = () => fetch('/api/admin/home/slides').then((r) => r.json()).then((j) => setSlides(j.data || []));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await fetch('/api/admin/home/slides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ title: '', imageUrl: '', navigationType: 'category', navigationTarget: '', ctaText: 'Book Now', isActive: true });
    load();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Home Slides</h1>
      <form onSubmit={create} className="space-y-3 mb-8 border p-4 rounded-lg">
        <input className="border p-2 w-full rounded" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="border p-2 w-full rounded" placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required />
        <input className="border p-2 w-full rounded" placeholder="Navigation target (category id)" value={form.navigationTarget} onChange={(e) => setForm({ ...form, navigationTarget: e.target.value })} required />
        <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded">Add Slide</button>
      </form>
      <ul className="space-y-2">
        {slides.map((s) => (
          <li key={s._id} className="border p-3 rounded flex justify-between">
            <span>{s.title} → {s.navigationTarget}</span>
            <span className="text-sm text-gray-500">{s.isActive ? 'Active' : 'Inactive'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
