'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Client {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_id: string;
    companies?: {
        company_name: string;
        site_address: string;
    };
}

export interface Region {
    id: string;
    name: string;
    code: string;
}

export interface SalesRep {
    id: string;
    name: string;
    email: string;
}

interface ClientDetailsFormProps {
    clientId: string;
    setClientId: (id: string) => void;
    siteAddress: string;
    setSiteAddress: (address: string) => void;
    regionId?: string;
    setRegionId?: (id: string) => void;
    jobType?: string;
    setJobType?: (type: string) => void;
    salesRepId?: string;
    setSalesRepId?: (id: string) => void;
    followUpDate?: string;
    setFollowUpDate?: (date: string) => void;
    // Additional fields for VA Workspace
    contactPerson?: string;
    setContactPerson?: (person: string) => void;
    contactEmail?: string;
    setContactEmail?: (email: string) => void;
    contactPhone?: string;
    setContactPhone?: (phone: string) => void;
    companyName?: string;
    setCompanyName?: (name: string) => void;
    showExtraFields?: boolean; // Toggle for VA Workspace specific fields
}

export default function ClientDetailsForm({
    clientId, setClientId,
    siteAddress, setSiteAddress,
    regionId, setRegionId,
    jobType, setJobType,
    salesRepId, setSalesRepId,
    followUpDate, setFollowUpDate,
    contactPerson, setContactPerson,
    contactEmail, setContactEmail,
    contactPhone, setContactPhone,
    companyName, setCompanyName,
    showExtraFields = false
}: ClientDetailsFormProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLookupData();
    }, []);

    const loadLookupData = async () => {
        try {
            setLoading(true);
            const [clientsRes, regionsRes, salesRepsRes] = await Promise.all([
                supabase.from('clients').select('id, first_name, last_name, email, phone, company_id, companies(company_name, site_address)'),
                supabase.from('regions').select('*').order('name'),
                supabase.from('sales_reps').select('*').order('name'),
            ]);

            if (clientsRes.data) setClients(clientsRes.data as any);
            if (regionsRes.data) setRegions(regionsRes.data as Region[]);
            if (salesRepsRes.data) {
                const activeSalesReps = salesRepsRes.data.filter((sr: any) => sr.is_active !== false);
                setSalesReps(activeSalesReps as SalesRep[]);
            }
        } catch (error) {
            console.error('Error loading lookup data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newClientId = e.target.value;
        setClientId(newClientId);

        const client = clients.find(c => c.id === newClientId);
        if (client) {
            if (client.companies?.site_address) {
                setSiteAddress(client.companies.site_address);
            }
            // Auto-fill other fields if available and setters provided
            if (showExtraFields) {
                if (setContactPerson) setContactPerson(`${client.first_name} ${client.last_name}`);
                if (setContactEmail) setContactEmail(client.email);
                if (setContactPhone) setContactPhone(client.phone);
                if (setCompanyName && client.companies?.company_name) setCompanyName(client.companies.company_name);
            }
        }
    };

    if (loading) return <div className="text-sm text-gray-500">Loading client details...</div>;

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Client Details</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <select
                        value={clientId}
                        onChange={handleClientChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                    >
                        <option value="">Select client...</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.first_name} {c.last_name} {c.companies?.company_name ? `- ${c.companies.company_name}` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {showExtraFields && companyName !== undefined && setCompanyName && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                            placeholder="Company Name"
                        />
                    </div>
                )}

                <div className={showExtraFields ? "col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Address *</label>
                    <input
                        type="text"
                        value={siteAddress}
                        onChange={(e) => setSiteAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        placeholder="8 Ulster Road, Blockhouse Bay"
                    />
                </div>

                {regionId !== undefined && setRegionId && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                        <select
                            value={regionId}
                            onChange={(e) => setRegionId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        >
                            <option value="">Select region...</option>
                            {regions.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {jobType !== undefined && setJobType && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                        <select
                            value={jobType}
                            onChange={(e) => setJobType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        >
                            <option value="">Select job type...</option>
                            <option value="New Build">New Build</option>
                            <option value="Renovation">Renovation</option>
                            <option value="Retrofit">Retrofit</option>
                            <option value="Commercial">Commercial</option>
                        </select>
                    </div>
                )}

                {salesRepId !== undefined && setSalesRepId && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sales Rep</label>
                        <select
                            value={salesRepId}
                            onChange={(e) => setSalesRepId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        >
                            <option value="">Select sales rep...</option>
                            {salesReps.map(sr => (
                                <option key={sr.id} value={sr.id}>{sr.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {followUpDate !== undefined && setFollowUpDate && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Follow-Up Date</label>
                        <input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        />
                    </div>
                )}

                {showExtraFields && (
                    <>
                        {contactPerson !== undefined && setContactPerson && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                <input
                                    type="text"
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                    placeholder="Contact Name"
                                />
                            </div>
                        )}
                        {contactEmail !== undefined && setContactEmail && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                    placeholder="email@example.com"
                                />
                            </div>
                        )}
                        {contactPhone !== undefined && setContactPhone && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                    placeholder="Phone Number"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
