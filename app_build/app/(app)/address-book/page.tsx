// @witness [UI-001]
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddressBookEntry {
  id: string;
  org_name: string;
  contact: {
    email: string | null;
    phone: string | null;
  };
}

export default function AddressBookPage() {
  const [contacts, setContacts] = useState<AddressBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/address-book', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setContacts(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = contacts.filter(c => {
    const term = search.toLowerCase();
    return c.org_name?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Address Book</h1>
        <p className="text-muted-foreground mt-1">Your accepted professional connections</p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by name, role, or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Link href="/connections/incoming">
          <Button variant="outline" size="sm">Incoming Requests</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
          <p className="text-4xl mb-3">📇</p>
          <p className="text-lg font-medium">
            {search ? 'No contacts match your search' : 'Your address book is empty'}
          </p>
          <p className="text-sm mt-1">
            {search
              ? 'Try adjusting your search terms'
              : 'Accept incoming handshakes or send connection requests to build your network'}
          </p>
          {!search && (
            <Link href="/discover" className="inline-block mt-4">
              <Button size="sm">Discover Professionals</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(contact => (
            <div key={contact.id} className="p-5 rounded-lg border border-border bg-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{contact.org_name}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
                    {contact.contact.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">📞</span>
                        <span>{contact.contact.phone}</span>
                      </div>
                    )}
                    {contact.contact.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">✉️</span>
                        <span>{contact.contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <Link href={`/profiles/${contact.id}`}>
                    <Button variant="outline" size="sm">View Full Profile</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
