'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PlanPage() {
  const [credits, setCredits] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [resetDate, setResetDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/profile/rate-limits', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/profiles/me', { credentials: 'include' }).then(r => r.json()),
    ]).then(([limitsRes, profileRes]) => {
      if (limitsRes.success) {
        setCredits(limitsRes.data.handshake_credits);
        setResetDate(limitsRes.data.reset_date ? new Date(limitsRes.data.reset_date) : null);
      }
      if (profileRes.success) {
        setSubscriptionStatus(profileRes.data.subscription_status);
        if (profileRes.data.trial_started_at) {
          const trialStart = new Date(profileRes.data.trial_started_at);
          setTrialEndsAt(new Date(trialStart.getTime() + 48 * 60 * 60 * 1000));
        }
      }
      setLoading(false);
    });
  }, []);

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_name: 'national_pro' }),
      });
      const data = await res.json();
      if (data.success && data.data.redirect_url) {
        window.location.href = data.data.redirect_url;
      }
    } catch (err) {
      console.error('Upgrade failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded" />)}</div>;

  const trialHoursLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 3600000)) : null;
  const creditsPercent = (credits / 30) * 100;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">My Plan</h1>

      {/* Subscription Status */}
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Subscription Status</p>
            <Badge variant={subscriptionStatus === 'active' ? 'default' : subscriptionStatus === 'trial' ? 'outline' : 'destructive'} className="mt-1">
              {subscriptionStatus.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Trial Countdown */}
      {subscriptionStatus === 'trial' && trialHoursLeft !== null && (
        <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
          <p className="font-medium text-yellow-800">Trial expires in {trialHoursLeft} hours</p>
          <p className="text-sm text-yellow-600 mt-1">Upgrade before expiry to avoid service interruption</p>
        </div>
      )}

      {/* Credits */}
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Handshake Credits</p>
            <p className="text-2xl font-bold">{credits} / 30</p>
          </div>
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${creditsPercent}%` }} />
          </div>
        </div>
        {resetDate && <p className="text-xs text-muted-foreground mt-2">Resets on {resetDate.toLocaleDateString()}</p>}
      </div>

      {/* Upgrade CTA */}
      {(subscriptionStatus === 'trial' || subscriptionStatus === 'expired') && (
        <div className="p-6 rounded-lg border bg-card text-center">
          <h2 className="text-lg font-semibold">Upgrade to National Pro</h2>
          <p className="text-sm text-muted-foreground mt-1">₹999/month · 30 handshake credits · India-wide access</p>
          <Button onClick={handleUpgrade} disabled={processing} className="mt-4">
            {processing ? 'Processing...' : 'Upgrade via PhonePe'}
          </Button>
        </div>
      )}

      {/* Active Subscription Info */}
      {subscriptionStatus === 'active' && (
        <div className="p-4 rounded-lg border bg-green-50 border-green-200">
          <p className="text-green-800 font-medium">✓ Your subscription is active</p>
          {resetDate && <p className="text-sm text-green-600 mt-1">Credits reset on {resetDate.toLocaleDateString()}</p>}
        </div>
      )}
    </div>
  );
}
