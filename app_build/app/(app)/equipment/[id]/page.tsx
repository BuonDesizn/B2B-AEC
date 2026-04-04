// @witness [ED-001]
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Equipment {
  id: string;
  name: string;
  category: string;
  description: string | null;
  monthly_rate: number | null;
  daily_rate: number | null;
  weekly_rate: number | null;
  location: string | null;
  type: string | null;
  operator_included: boolean | null;
  available: boolean | null;
  is_active: boolean | null;
  features: string[] | null;
  created_at: string;
}

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { params.then(p => setResolvedParams(p)); }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetch(`/api/equipment/${resolvedParams.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setEquipment(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [resolvedParams]);

  const handleDelete = async () => {
    if (!resolvedParams || !confirm('Are you sure?')) return;
    await fetch(`/api/equipment/${resolvedParams.id}`, { method: 'DELETE', credentials: 'include' });
    router.push('/equipment');
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;
  if (!equipment) return <div className="text-center py-12"><p className="text-lg text-muted-foreground">Equipment not found</p><Link href="/equipment"><Button className="mt-4">Back to Equipment</Button></Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/equipment" className="text-muted-foreground hover:text-foreground">← Back</Link>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">{equipment.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/equipment/${equipment.id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>
          <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{equipment.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{equipment.category}</p>
          </div>
          <Badge variant={equipment.status === 'ACTIVE' ? 'default' : 'secondary'}>{equipment.status}</Badge>
        </div>

        {equipment.description && (
          <div>
            <h3 className="text-sm font-medium mb-1">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{equipment.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {equipment.monthly_rate && <div><p className="font-medium">Monthly Rate</p><p className="text-muted-foreground">₹{equipment.monthly_rate.toLocaleString('en-IN')}</p></div>}
          {equipment.daily_rate && <div><p className="font-medium">Daily Rate</p><p className="text-muted-foreground">₹{equipment.daily_rate.toLocaleString('en-IN')}</p></div>}
          {equipment.weekly_rate && <div><p className="font-medium">Weekly Rate</p><p className="text-muted-foreground">₹{equipment.weekly_rate.toLocaleString('en-IN')}</p></div>}
          {equipment.location && <div><p className="font-medium">Location</p><p className="text-muted-foreground">{equipment.location}</p></div>}
        </div>

        {equipment.type && (
          <div className="text-sm">
            <p className="font-medium">Type</p>
            <p className="text-muted-foreground">{equipment.type}</p>
          </div>
        )}

        {equipment.features && equipment.features.length > 0 && (
          <div>
            <p className="font-medium text-sm mb-1">Features</p>
            <div className="flex flex-wrap gap-1">
              {equipment.features.map((f, i) => <Badge key={i} variant="outline" className="text-xs">{f}</Badge>)}
            </div>
          </div>
        )}

        <div className="flex gap-4 text-sm">
          <Badge variant={equipment.available ? 'default' : 'secondary'}>{equipment.available ? 'Available' : 'Unavailable'}</Badge>
          <Badge variant={equipment.operator_included ? 'default' : 'outline'}>{equipment.operator_included ? 'Operator Included' : 'No Operator'}</Badge>
        </div>

        <p className="text-xs text-muted-foreground">Created {new Date(equipment.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
