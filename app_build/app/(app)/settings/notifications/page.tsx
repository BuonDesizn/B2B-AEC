'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

type ToggleKey =
  | 'email_enabled'
  | 'sms_enabled'
  | 'push_enabled'
  | 'connection_requests'
  | 'rfp_responses'
  | 'ad_moderation'
  | 'subscription_alerts';

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<Record<ToggleKey, boolean>>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    connection_requests: true,
    rfp_responses: true,
    ad_moderation: true,
    subscription_alerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/notifications/preferences', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setPrefs(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (key: ToggleKey) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Preferences saved successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save preferences' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const channels: { key: ToggleKey; label: string; desc: string }[] = [
    { key: 'email_enabled', label: 'Email Notifications', desc: 'Receive notifications via email' },
    { key: 'sms_enabled', label: 'SMS Notifications', desc: 'Receive notifications via text message' },
    { key: 'push_enabled', label: 'Push Notifications', desc: 'Receive browser push notifications' },
  ];

  const types: { key: ToggleKey; label: string; desc: string }[] = [
    { key: 'connection_requests', label: 'Connection Requests', desc: 'When someone sends you a handshake request' },
    { key: 'rfp_responses', label: 'RFP Responses', desc: 'When someone responds to your RFP or your response is viewed' },
    { key: 'ad_moderation', label: 'Ad Moderation', desc: 'Updates on your ad approval status' },
    { key: 'subscription_alerts', label: 'Subscription Alerts', desc: 'Trial expiry, billing, and plan change notifications' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Notification Preferences</h1>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-600 border border-green-500/20'
              : 'bg-red-500/10 text-red-600 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold font-[var(--font-playfair)] mb-4">Notification Channels</h2>
          <div className="space-y-4">
            {channels.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    prefs[key] ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      prefs[key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h2 className="text-lg font-semibold font-[var(--font-playfair)] mb-4">Notification Types</h2>
          <div className="space-y-4">
            {types.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    prefs[key] ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      prefs[key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
