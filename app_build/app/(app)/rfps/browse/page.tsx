'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BrowseRfp {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  budget_min: number | null;
  budget_max: number | null;
  project_city: string;
  project_state: string;
  description: string | null;
  status: string;
  expiry_date: string | null;
  responses_count: number;
  creator_name?: string;
  has_responded?: boolean;
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'PROJECT', label: 'Project' },
];

const INDIAN_STATES = [
  { value: '', label: 'All States' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Assam', label: 'Assam' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Chhattisgarh', label: 'Chhattisgarh' },
  { value: 'Goa', label: 'Goa' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Odisha', label: 'Odisha' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Uttarakhand', label: 'Uttarakhand' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Delhi', label: 'Delhi' },
];

const formatINR = (val: number | null) => {
  if (val === null) return null;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
};

export default function BrowseRFPsPage() {
  const router = useRouter();
  const [rfps, setRfps] = useState<BrowseRfp[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryFilter) params.set('category', categoryFilter);
    if (stateFilter) params.set('state', stateFilter);

    fetch(`/api/rfps/browse?${params.toString()}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setRfps(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [categoryFilter, stateFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Browse RFPs</h1>
        <p className="text-sm text-muted-foreground">Find open requests and submit your proposals</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {INDIAN_STATES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : rfps.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No open RFPs found</p>
          <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rfps.map(rfp => (
            <div
              key={rfp.id}
              className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-2">{rfp.title}</h3>
                  <Badge variant="default" className="text-xs flex-shrink-0">OPEN</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {rfp.category}{rfp.subcategory ? ` · ${rfp.subcategory}` : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {rfp.project_city}, {rfp.project_state}
                </p>
                {rfp.budget_min || rfp.budget_max ? (
                  <p className="text-sm font-medium">
                    {rfp.budget_min && rfp.budget_max
                      ? `${formatINR(rfp.budget_min)} — ${formatINR(rfp.budget_max)}`
                      : rfp.budget_min
                      ? `From ${formatINR(rfp.budget_min)}`
                      : `Up to ${formatINR(rfp.budget_max)}`}
                  </p>
                ) : null}
                {rfp.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{rfp.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{rfp.responses_count || 0} response{(rfp.responses_count || 0) !== 1 ? 's' : ''}</span>
                  {rfp.expiry_date && (
                    <span>Expires: {new Date(rfp.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                {rfp.has_responded ? (
                  <Badge variant="secondary" className="text-xs">Already Responded</Badge>
                ) : (
                  <Link href={`/rfps/${rfp.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">Respond</Button>
                  </Link>
                )}
                <Link href={`/rfps/${rfp.id}`} className="flex-1">
                  <Button size="sm" className="w-full">View Details</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
