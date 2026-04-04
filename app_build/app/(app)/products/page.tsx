// @witness [UI-001]
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Product {
  id: string;
  name: string;
  category: string;
  price_per_unit?: number;
  unit?: string;
  min_order_quantity?: number;
  available: boolean;
}

export default function MyProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/products', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setProducts(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const previous = [...products];
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!data.success) {
        setProducts(previous);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setProducts(previous);
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && p.available) ||
      (statusFilter === 'inactive' && !p.available);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog</p>
        </div>
        <Link href="/products/new">
          <Button>Add Product</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search products by name, category, or model..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card">
          <p className="text-lg text-muted-foreground">
            {search || statusFilter !== 'all' ? 'No products match your filters' : 'No products found'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link href="/products/new">
              <Button className="mt-4">Add your first product</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(product => (
            <div key={product.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                  {product.price_per_unit && (
                    <p className="text-lg font-bold mt-1">
                      ₹{Number(product.price_per_unit).toLocaleString('en-IN')}/{product.unit || 'unit'}
                    </p>
                  )}
                  {product.min_order_quantity && (
                    <p className="text-xs text-muted-foreground mt-1">MOQ: {product.min_order_quantity} {product.unit || 'Nos'}</p>
                  )}
                </div>
                <Badge variant={product.available ? 'default' : 'outline'}>
                  {product.available ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex gap-2 mt-3">
                <Link href={`/products/${product.id}/edit`}>
                  <Button size="sm" variant="outline">Edit</Button>
                </Link>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filtered.length} of {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
