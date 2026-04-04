// @witness [CON-001]
'use client';

import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface OwnedEquipment {
  name: string;
  category: string;
  type?: string;
  quantity: number | string;
  available: boolean;
  status: string;
}

export default function MyEquipmentPage() {
  const [equipment, setEquipment] = useState<OwnedEquipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('contractors')
        .select('owned_equipment')
        .eq('profile_id', user.id)
        .single();
      if (data?.owned_equipment) {
        setEquipment(data.owned_equipment as unknown as OwnedEquipment[]);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">My Equipment</h1>
        <p className="text-sm text-muted-foreground mt-1">Equipment owned by your company</p>
      </div>
      {equipment.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No equipment listed</p>
          <p className="text-sm mt-1">Update your contractor profile to add equipment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((eq: OwnedEquipment, i: number) => (
            <div key={i} className="rounded-lg border bg-card p-5 space-y-2">
              <h3 className="font-semibold">{eq.type || eq.category || 'Equipment'}</h3>
              <Badge variant={eq.available ? 'default' : 'secondary'}>{eq.available ? 'Available' : 'In Use'}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
