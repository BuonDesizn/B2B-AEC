// @witness [RM-001]
'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function DQSConfigPage() {
  const [config, setConfig] = useState({ quality_weight: 0.7, distance_weight: 0.3 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/config/dqs', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { 
        if (data.success) setConfig(data.data); 
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/admin/config/dqs', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">DQS Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">Discovery Quality Score ranking weights</p>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Quality Weight: {config.quality_weight}</label>
          <input type="range" min="0" max="1" step="0.05" value={config.quality_weight}
            onChange={e => setConfig(_prev => ({ quality_weight: parseFloat(e.target.value), distance_weight: 1 - parseFloat(e.target.value) }))}
            className="w-full" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Distance Weight: {config.distance_weight}</label>
          <input type="range" min="0" max="1" step="0.05" value={config.distance_weight}
            onChange={e => setConfig(_prev => ({ quality_weight: 1 - parseFloat(e.target.value), distance_weight: parseFloat(e.target.value) }))}
            className="w-full" />
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Weights'}</Button>
      </div>
    </div>
  );
}
