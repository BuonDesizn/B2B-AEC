// @witness [PS-001]
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  price_per_unit: number | null;
  unit: string | null;
  min_order_quantity: number | null;
  specifications: Record<string, any> | null;
  available: boolean | null;
  is_active: boolean | null;
  created_at: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { params.then(p => setResolvedParams(p)); }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetch(`/api/products/${resolvedParams.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setProduct(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [resolvedParams]);

  const handleDelete = async () => {
    if (!resolvedParams || !confirm('Are you sure?')) return;
    await fetch(`/api/products/${resolvedParams.id}`, { method: 'DELETE', credentials: 'include' });
    router.push('/products');
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;
  if (!product) return <div className="text-center py-12"><p className="text-lg text-muted-foreground">Product not found</p><Link href="/products"><Button className="mt-4">Back to Products</Button></Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/products" className="text-muted-foreground hover:text-foreground">← Back</Link>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${product.id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>
          <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{product.category}{product.subcategory ? ` · ${product.subcategory}` : ''}</p>
          </div>
          <Badge variant={product.is_active ? 'default' : 'secondary'}>{product.is_active ? 'Active' : 'Inactive'}</Badge>
        </div>

        {product.description && (
          <div>
            <h3 className="text-sm font-medium mb-1">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {product.price_per_unit && <div><p className="font-medium">Price</p><p className="text-muted-foreground">₹{product.price_per_unit.toLocaleString('en-IN')}/{product.unit || 'unit'}</p></div>}
          {product.min_order_quantity && <div><p className="font-medium">Min Order</p><p className="text-muted-foreground">{product.min_order_quantity} {product.unit || 'Nos'}</p></div>}
          <div><p className="font-medium">Availability</p><p className="text-muted-foreground">{product.available ? 'In Stock' : 'Out of Stock'}</p></div>
        </div>

        {product.specifications && (
          <div>
            <h3 className="text-sm font-medium mb-2">Specifications</h3>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">{JSON.stringify(product.specifications, null, 2)}</pre>
          </div>
        )}

        <p className="text-xs text-muted-foreground">Created {new Date(product.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
