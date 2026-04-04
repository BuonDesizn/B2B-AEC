'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const DiscoveryMap = dynamic(
  () => import('@/components/discovery/discovery-map').then(m => m.DiscoveryMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-muted animate-pulse" /> }
);

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'PP', label: 'Project Professional' },
  { value: 'C', label: 'Consultant' },
  { value: 'CON', label: 'Contractor' },
  { value: 'PS', label: 'Product Seller' },
  { value: 'ED', label: 'Equipment Dealer' },
];

const RADII = [10, 25, 50, 100];

export default function DiscoverPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState('');
  const [radius, setRadius] = useState(50);
  const [location, setLocation] = useState({ lat: 19.076, lng: 72.8777 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const params = await searchParams;
      if (params.role) setRole(params.role);
    })();
  }, [searchParams]);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search/profiles?lat=${location.lat}&lng=${location.lng}&r=${radius}&q=${keyword}&persona_type=${role}&page=${page}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setResults(prev => page === 1 ? data.data : [...prev, ...data.data]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [location, radius, keyword, role, page]);

  useEffect(() => { search(); }, [search]);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn('Location detection failed')
      );
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 border-b bg-card space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">Keyword</label>
            <Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search by name or specialty" />
          </div>
          <div className="w-[180px]">
            <label className="text-sm font-medium mb-1 block">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="w-[120px]">
            <label className="text-sm font-medium mb-1 block">Radius (km)</label>
            <div className="flex gap-1">
              {RADII.map(r => (
                <Button key={r} variant={radius === r ? 'default' : 'outline'} size="sm" onClick={() => setRadius(r)} className="flex-1 px-1">{r}</Button>
              ))}
            </div>
          </div>
          <Button onClick={detectLocation} variant="outline">📍 Detect</Button>
          <Button onClick={() => { setPage(1); search(); }}>Search</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[40%] border-r">
          <DiscoveryMap
            results={results}
            centerLat={location.lat}
            centerLng={location.lng}
            radiusKm={radius}
          />
        </div>
        <div className="w-[60%] overflow-y-auto p-4 space-y-3">
          {loading && results.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))
          ) : results.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm">Try adjusting your search radius or filters</p>
              </div>
            </div>
          ) : (
            <>
              {results.map((r: any) => (
                <div key={r.profile_id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{r.display_name}</h3>
                      <p className="text-sm text-muted-foreground">{r.city}, {r.state}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-input px-2.5 py-0.5 text-xs font-semibold">{r.persona_type}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>DQS: {(r.dqs_score ?? 0).toFixed(2)}</span>
                    <span>{r.distance_km?.toFixed(1)} km</span>
                    <span>Score: {((r.ranked_score ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="default">Connect</Button>
                    <Button size="sm" variant="outline">View Profile</Button>
                  </div>
                </div>
              ))}
              {loading && <div className="h-24 bg-muted rounded-lg animate-pulse" />}
              {!loading && results.length >= 20 && (
                <Button onClick={() => setPage(p => p + 1)} variant="outline" className="w-full">Load More</Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
