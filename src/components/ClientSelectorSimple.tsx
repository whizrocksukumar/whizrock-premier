'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Site = {
  id: string;
  address_line_1: string;
  city: string | null;
  postcode: string | null;
  region_id: string | null;
  client_id: string | null;
  company_id: string | null;
};

type Props = {
  contactId?: string;
  contactCompanyId?: string;
  companyId?: string;
  value?: string;
  onChange: (site: Site | null) => void;
  label?: string;
};

export default function SiteSelectorSimple({
  contactId,
  contactCompanyId,
  companyId,
  value,
  onChange,
  label = 'Site Address',
}: Props) {
  const [sites, setSites] = useState<Site[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, contactCompanyId, companyId, search]);

  const loadSites = async () => {
    setLoading(true);

    let query = supabase
      .from('sites')
      .select(
        'id, address_line_1, city, postcode, region_id, client_id, company_id'
      )
      .order('address_line_1');

    // MODE 3 — Address search (highest priority)
    if (search.trim()) {
      query = query.ilike('address_line_1', `%${search.trim()}%`);
    }
    // MODE 2 — Company selected
    else if (companyId) {
      query = query.eq('company_id', companyId);
    }
    // MODE 1 — Contact selected (contact OR contact company)
    else if (contactId) {
      if (contactCompanyId) {
        query = query.or(
          `client_id.eq.${contactId},company_id.eq.${contactCompanyId}`
        );
      } else {
        query = query.eq('client_id', contactId);
      }
    }
    // else: no filter → empty state
    else {
      setSites([]);
      setLoading(false);
      return;
    }

    const { data, error } = await query;

    if (!error && data) {
      setSites(data as Site[]);
    } else {
      setSites([]);
    }

    setLoading(false);
  };

  const selectedSite = sites.find((s) => s.id === value) || null;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search address…"
        className="w-full mb-2 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />

      <select
        value={value || ''}
        onChange={(e) => {
          const site = sites.find((s) => s.id === e.target.value) || null;
          onChange(site);
        }}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      >
        <option value="">
          {loading
            ? 'Loading sites…'
            : sites.length
            ? 'Select site address'
            : 'No sites found'}
        </option>

        {sites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.address_line_1}
          </option>
        ))}
      </select>

      {selectedSite && (
        <div className="mt-2 text-xs text-gray-600">
          {[selectedSite.city, selectedSite.postcode].filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );
}
