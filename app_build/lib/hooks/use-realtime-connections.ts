import { useEffect, useState, useCallback } from 'react';

import { createClient } from '@/lib/supabase/client';

interface Connection {
  id: string;
  requester_id: string;
  target_id: string;
  status: string;
  requester_message: string | null;
  initiated_at: string;
  expires_at: string | null;
}

export function useRealtimeIncomingConnections(userId: string) {
  const [connections, setConnections] = useState<Connection[]>([]);

  // Fetch initial incoming connections
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('connections')
      .select('*')
      .eq('target_id', userId)
      .eq('status', 'REQUESTED')
      .order('initiated_at', { ascending: false })
      .then(({ data }) => {
        if (data) setConnections(data);
      });
  }, [userId]);

  // Subscribe to new incoming connections
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`incoming-connections-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connections',
          filter: `target_id=eq.${userId}`,
        },
        (payload) => {
          const newConnection = payload.new as Connection;
          if (newConnection.status === 'REQUESTED') {
            setConnections(prev => [newConnection, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'connections',
          filter: `target_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Connection;
          if (updated.status !== 'REQUESTED') {
            setConnections(prev => prev.filter(c => c.id !== updated.id));
          } else {
            setConnections(prev => prev.map(c => c.id === updated.id ? updated : c));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const acceptConnection = useCallback(async (connectionId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'ACCEPTED', responded_at: new Date().toISOString() })
      .eq('id', connectionId)
      .select()
      .single();
    
    if (!error && data) {
      setConnections(prev => prev.filter(c => c.id !== connectionId));
    }
    return { data, error };
  }, []);

  const rejectConnection = useCallback(async (connectionId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'REJECTED', responded_at: new Date().toISOString() })
      .eq('id', connectionId)
      .select()
      .single();
    
    if (!error && data) {
      setConnections(prev => prev.filter(c => c.id !== connectionId));
    }
    return { data, error };
  }, []);

  return { connections, acceptConnection, rejectConnection };
}
