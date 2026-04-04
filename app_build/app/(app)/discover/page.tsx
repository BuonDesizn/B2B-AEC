// @witness [UI-001]
'use client';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { type SearchResult } from '@/components/discovery/discovery-map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [radius, setRadius] = useState(50);
  const [location, setLocation] = useState({ lat: 19.076, lng: 72.8777 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const q = searchParams.get('q');
    const r = searchParams.get('role');
    if (q) setKeyword(q);
    if (r) setRole(r);
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
              {ROLES.map((r: { value: string; label: string }) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="w-[120px]">
            <label className="text-sm font-medium mb-1 block">Radius (km)</label>
            <div className="flex gap-1">
              {RADII.map((r: number) => (
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
                    <Badge variant="outline">{r.persona_type}</Badge>
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
