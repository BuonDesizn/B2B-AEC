// @witness [UI-001]
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RfpDetail {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  budget_min: number | null;
  budget_max: number | null;
  project_city: string;
  project_state: string;
  project_address: string | null;
  location_pin: string | null;
  description: string | null;
  requirements: string | null;
  target_personas: string[] | null;
  status: string;
  expiry_date: string | null;
  closes_at: string | null;
  estimated_duration_days: number | null;
  creator_id: string;
  created_at: string;
  creator_name?: string;
}

interface RfpResponse {
  id: string;
  rfp_id: string;
  responder_id: string;
  proposal: string;
  estimated_cost: number | null;
  estimated_days: number | null;
  status: string;
  created_at: string;
  responder_name?: string;
  responder_persona?: string;
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'OPEN': return 'default';
    case 'CLOSED': return 'secondary';
    case 'CANCELLED':
    case 'EXPIRED': return 'destructive';
    default: return 'outline';
  }
};

const formatINR = (val: number | null) => {
  if (val === null) return 'Not specified';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
};

export default function RFPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [rfp, setRfp] = useState<RfpDetail | null>(null);
  const [responses, setResponses] = useState<RfpResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [responseForm, setResponseForm] = useState({
    proposal: '',
    estimated_cost: '',
    estimated_days: '',
  });
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    const fetchRfp = async () => {
      try {
        const res = await fetch(`/api/rfps/${resolvedParams.id}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setRfp(data.data.rfp);
          setIsCreator(data.data.is_creator);
          setHasResponded(data.data.has_responded);
          if (data.data.is_creator) {
            const respRes = await fetch(`/api/rfps/${resolvedParams.id}/responses`, { credentials: 'include' });
            const respData = await respRes.json();
            if (respData.success) setResponses(respData.data);
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchRfp();
  }, [resolvedParams]);

  const handleResponseSubmit = async () => {
    setSubmittingResponse(true);
    setResponseError('');
    setSuccessMessage('');
    try {
      const res = await fetch(`/api/rfps/${resolvedParams?.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          proposal: responseForm.proposal,
          estimated_cost: responseForm.estimated_cost ? parseFloat(responseForm.estimated_cost) : null,
          estimated_days: responseForm.estimated_days ? parseInt(responseForm.estimated_days) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Response submitted successfully!');
        setResponseForm({ proposal: '', estimated_cost: '', estimated_days: '' });
        setHasResponded(true);
      } else {
        setResponseError(data.error?.message || 'Failed to submit response');
      }
    } catch {
      setResponseError('Network error. Please try again.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleResponseAction = async (responseId: string, action: string) => {
    setActionLoading(`${responseId}-${action}`);
    setSuccessMessage('');
    setGeneralError('');
    try {
      const res = await fetch(`/api/rfps/${resolvedParams?.id}/responses/${responseId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ response_id: responseId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Response ${action}ed successfully`);
        const respRes = await fetch(`/api/rfps/${resolvedParams?.id}/responses`, { credentials: 'include' });
        const respData = await respRes.json();
        if (respData.success) setResponses(respData.data);
      } else {
        setGeneralError(data.error?.message || `Failed to ${action} response`);
      }
    } catch {
      setGeneralError('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRFPAction = async (action: 'close' | 'cancel' | 'publish') => {
    setActionLoading(action);
    setSuccessMessage('');
    setGeneralError('');
    try {
      const res = await fetch(`/api/rfps/${resolvedParams?.id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`RFP ${action}ed successfully`);
        const rfpRes = await fetch(`/api/rfps/${resolvedParams?.id}`, { credentials: 'include' });
        const rfpData = await rfpRes.json();
        if (rfpData.success) {
          setRfp(rfpData.data.rfp);
        }
      } else {
        setGeneralError(data.error?.message || `Failed to ${action} RFP`);
      }
    } catch {
      setGeneralError('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">RFP not found</p>
        <Link href="/rfps">
          <Button className="mt-4">Back to RFPs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/rfps" className="text-muted-foreground hover:text-foreground">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold">{rfp.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {rfp.category}{rfp.subcategory ? ` · ${rfp.subcategory}` : ''}
          </p>
        </div>
        <Badge variant={statusBadgeVariant(rfp.status) as any} className="text-sm px-3 py-1">
          {rfp.status}
        </Badge>
      </div>

      {generalError && (
        <div className="p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {generalError}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-md border border-green-500/50 bg-green-500/10 text-green-600 text-sm">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Budget</p>
              <p className="text-sm text-muted-foreground">
                {rfp.budget_min && rfp.budget_max
                  ? `${formatINR(rfp.budget_min)} — ${formatINR(rfp.budget_max)}`
                  : rfp.budget_min
                  ? `From ${formatINR(rfp.budget_min)}`
                  : rfp.budget_max
                  ? `Up to ${formatINR(rfp.budget_max)}`
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">
                {rfp.project_city}{rfp.project_state ? `, ${rfp.project_state}` : ''}
              </p>
              {rfp.project_address && (
                <p className="text-sm text-muted-foreground">{rfp.project_address}</p>
              )}
              {rfp.location_pin && (
                <p className="text-sm text-muted-foreground">Pin: {rfp.location_pin}</p>
              )}
            </div>
            {rfp.target_personas && rfp.target_personas.length > 0 && (
              <div>
                <p className="text-sm font-medium">Target Personas</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {rfp.target_personas.map(p => (
                    <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Expiry Date</p>
              <p className="text-sm text-muted-foreground">
                {rfp.expiry_date ? new Date(rfp.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Closes At</p>
              <p className="text-sm text-muted-foreground">
                {rfp.closes_at ? new Date(rfp.closes_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Estimated Duration</p>
              <p className="text-sm text-muted-foreground">
                {rfp.estimated_duration_days ? `${rfp.estimated_duration_days} days` : 'Not specified'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {rfp.description && (
        <div className="rounded-lg border bg-card p-6 space-y-2">
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rfp.description}</p>
        </div>
      )}

      {rfp.requirements && (
        <div className="rounded-lg border bg-card p-6 space-y-2">
          <h2 className="text-lg font-semibold">Requirements</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rfp.requirements}</p>
        </div>
      )}

      {isCreator ? (
        <>
          {rfp.status === 'DRAFT' && (
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">RFP Actions</h2>
              <div className="flex gap-3">
                <Button
                  disabled={actionLoading === 'publish'}
                  onClick={() => handleRFPAction('publish')}
                >
                  {actionLoading === 'publish' ? 'Publishing...' : 'Publish'}
                </Button>
              </div>
            </div>
          )}

          {rfp.status === 'OPEN' && (
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">RFP Actions</h2>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  disabled={actionLoading === 'close'}
                  onClick={() => handleRFPAction('close')}
                >
                  {actionLoading === 'close' ? 'Closing...' : 'Close RFP'}
                </Button>
                <Button
                  variant="destructive"
                  disabled={actionLoading === 'cancel'}
                  onClick={() => handleRFPAction('cancel')}
                >
                  {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel RFP'}
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Responses ({responses.length})</h2>
          {responses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No responses yet</p>
          ) : (
            <div className="space-y-3">
              {responses.map(resp => (
                <div key={resp.id} className="p-4 rounded-md border bg-background space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{resp.responder_name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{resp.responder_persona || 'Unknown'} · {new Date(resp.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <Badge variant={(resp.status === 'ACCEPTED' ? 'default' : resp.status === 'REJECTED' ? 'destructive' : 'outline') as any}>
                      {resp.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{resp.proposal}</p>
                  <div className="flex gap-4 text-sm">
                    {resp.estimated_cost && (
                      <span className="text-muted-foreground">Cost: {formatINR(resp.estimated_cost)}</span>
                    )}
                    {resp.estimated_days && (
                      <span className="text-muted-foreground">Timeline: {resp.estimated_days} days</span>
                    )}
                  </div>
                  {resp.status === 'PENDING' && rfp.status === 'OPEN' && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={() => handleResponseAction(resp.id, 'shortlist')}>
                        {actionLoading === `${resp.id}-shortlist` ? '...' : 'Shortlist'}
                      </Button>
                      <Button size="sm" variant="default" onClick={() => handleResponseAction(resp.id, 'accept')}>
                        {actionLoading === `${resp.id}-accept` ? '...' : 'Accept'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleResponseAction(resp.id, 'reject')}>
                        {actionLoading === `${resp.id}-reject` ? '...' : 'Reject'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </>
      ) : (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Submit Response</h2>
          {hasResponded ? (
            <div className="p-4 rounded-md bg-muted">
              <p className="text-sm font-medium">You have already responded to this RFP</p>
              <p className="text-xs text-muted-foreground">Your response is pending review by the creator</p>
            </div>
          ) : rfp.status !== 'OPEN' ? (
            <div className="p-4 rounded-md bg-muted">
              <p className="text-sm text-muted-foreground">This RFP is no longer accepting responses</p>
            </div>
          ) : (
            <>
              {responseError && (
                <div className="p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
                  {responseError}
                </div>
              )}
              {successMessage && !responseError && (
                <div className="p-3 rounded-md border border-green-500/50 bg-green-500/10 text-green-600 text-sm">
                  {successMessage}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Proposal *</label>
                  <textarea
                    value={responseForm.proposal}
                    onChange={e => setResponseForm(prev => ({ ...prev, proposal: e.target.value }))}
                    rows={5}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    placeholder="Describe your approach, qualifications, and why you're the right fit..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Estimated Cost (INR)</label>
                    <Input
                      type="number"
                      value={responseForm.estimated_cost}
                      onChange={e => setResponseForm(prev => ({ ...prev, estimated_cost: e.target.value }))}
                      placeholder="e.g., 750000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Estimated Days</label>
                    <Input
                      type="number"
                      value={responseForm.estimated_days}
                      onChange={e => setResponseForm(prev => ({ ...prev, estimated_days: e.target.value }))}
                      placeholder="e.g., 45"
                    />
                  </div>
                </div>
                <Button
                  disabled={submittingResponse || !responseForm.proposal}
                  onClick={handleResponseSubmit}
                >
                  {submittingResponse ? 'Submitting...' : 'Submit Response'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
