'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function MyEquipmentPage() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/equipment', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setEquipment(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    const previous = [...equipment];
    setEquipment(prev => prev.filter(e => e.id !== id));
    try {
      const res = await fetch(`/api/equipment/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!data.success) {
        setEquipment(previous);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setEquipment(previous);
    }
  };

  const filtered = equipment.filter(e => {
    const matchesSearch = e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.category?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'available' && e.available) ||
      (statusFilter === 'rented' && !e.available);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Equipment</h1>
          <p className="text-sm text-muted-foreground">Manage your equipment listings</p>
        </div>
        <Link href="/equipment/new">
          <Button>Add Equipment</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search equipment by name, category, or location..."
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
          <option value="available">Available</option>
          <option value="rented">Rented/Unavailable</option>
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
            {search || statusFilter !== 'all' ? 'No equipment match your filters' : 'No equipment found'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link href="/equipment/new">
              <Button className="mt-4">Add your first equipment</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => (
            <div key={item.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                  {item.monthly_rate && (
                    <p className="text-sm font-medium mt-1">
                      Rent: ₹{Number(item.monthly_rate).toLocaleString('en-IN')}/mo
                    </p>
                  )}
                  {item.daily_rate && (
                    <p className="text-sm font-medium">
                      Day: ₹{Number(item.daily_rate).toLocaleString('en-IN')}
                    </p>
                  )}
                  {item.location && (
                    <p className="text-xs text-muted-foreground mt-1">📍 {item.location}</p>
                  )}
                </div>
                <Badge variant={item.available ? 'default' : 'outline'}>
                  {item.available ? 'Available' : 'Rented'}
                </Badge>
              </div>
              <div className="flex gap-2 mt-3">
                <Link href={`/equipment/${item.id}/edit`}>
                  <Button size="sm" variant="outline">Edit</Button>
                </Link>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filtered.length} of {equipment.length} item{equipment.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
