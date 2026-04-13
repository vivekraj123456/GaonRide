import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { Navigation, Car, Package, Calendar, Users, Mail, LogOut, RefreshCw, Eye } from 'lucide-react';
import { googleDirectionsUrl, googlePointUrl, haversineKm, openStreetMapEmbedUrl, toLatLng } from '../lib/geo';

type Tab = 'overview' | 'rides' | 'deliveries' | 'events' | 'partners' | 'messages';

type MatchItem = {
  partner: any;
  distanceKm: number;
  partnerCoords: { lat: number; lng: number };
  updatedAt: string;
};

const getRequestedDate = (row: any, table: string): Date => {
  if (table === 'ride_bookings' && row.preferred_date) return new Date(row.preferred_date);
  if (table === 'delivery_orders' && row.preferred_date) return new Date(row.preferred_date);
  if (table === 'event_quotes' && row.event_date) return new Date(row.event_date);
  return new Date();
};

const getRequestCoords = (row: any, table: string) => {
  if (table === 'ride_bookings') return toLatLng(row.user_live_lat, row.user_live_lng) || toLatLng(row.pickup_lat, row.pickup_lng);
  if (table === 'delivery_orders') return toLatLng(row.user_live_lat, row.user_live_lng) || toLatLng(row.request_lat, row.request_lng);
  if (table === 'event_quotes') return toLatLng(row.user_live_lat, row.user_live_lng) || toLatLng(row.venue_lat, row.venue_lng);
  return null;
};

const tableToRole = (table: string): string | null => {
  if (table === 'ride_bookings') return 'driver';
  if (table === 'delivery_orders') return 'parcel_boy';
  if (table === 'event_quotes') return 'event_support';
  return null;
};

const AdminPage: React.FC = () => {
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [rides, setRides] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [partnerLocations, setPartnerLocations] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setIsLoggedIn(true);
      fetchAllData();
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError(error.message);
    } else {
      setIsLoggedIn(true);
      fetchAllData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
  };

  const fetchAllData = useCallback(async () => {
    const [r, d, ev, p, m, loc] = await Promise.all([
      supabase.from('ride_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('delivery_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('event_quotes').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_live_locations').select('*'),
    ]);
    setRides(r.data || []);
    setDeliveries(d.data || []);
    setEvents(ev.data || []);
    setPartners(p.data || []);
    setMessages(m.data || []);
    setPartnerLocations(loc.data || []);
  }, []);

  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        fetchAllData();
      }, 400);
    };

    const channel = supabase.channel('admin-realtime');
    ['ride_bookings', 'delivery_orders', 'event_quotes', 'partner_registrations', 'contact_messages', 'partner_live_locations'].forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => scheduleRefresh());
    });
    channel.subscribe();

    const pollId = window.setInterval(fetchAllData, 15000);
    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(pollId);
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, [fetchAllData, isLoggedIn]);

  const updateStatus = async (table: string, id: string, status: string) => {
    await supabase.from(table).update({ status }).eq('id', id);
    fetchAllData();
  };

  const deleteRecord = async (table: string, id: string) => {
    const ok = window.confirm('Delete this record?');
    if (!ok) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      showToast(`Delete failed: ${error.message}`);
      return;
    }
    showToast('Record deleted.');
    fetchAllData();
  };

  const assignNearestPartner = async (table: string, row: any, partner: any, distanceKm?: number) => {
    const { error: bookingErr } = await supabase
      .from(table)
      .update({
        assigned_partner_id: partner.id,
        assigned_partner_name: partner.full_name,
        assigned_partner_phone: partner.phone,
        assigned_distance_km: typeof distanceKm === 'number' && Number.isFinite(distanceKm) ? distanceKm : null,
        assigned_at: new Date().toISOString(),
        status: row.status === 'pending' ? 'confirmed' : row.status,
      })
      .eq('id', row.id);
    if (bookingErr) {
      showToast(`Assignment failed: ${bookingErr.message}`);
      return;
    }

    const { error: partnerErr } = await supabase
      .from('partner_registrations')
      .update({ is_available: false })
      .eq('id', partner.id);
    if (partnerErr) {
      showToast(`Partner updated with warning: ${partnerErr.message}`);
    }

    const distanceLabel = typeof distanceKm === 'number' && Number.isFinite(distanceKm) ? ` (${distanceKm.toFixed(2)} km)` : '';
    showToast(`Assigned ${partner.full_name}${distanceLabel}.`);
    fetchAllData();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      pending: '#ff8c00', completed: '#10b981', confirmed: '#3b82f6', cancelled: '#ef4444', unread: '#ff8c00', read: '#10b981', resolved: '#3b82f6',
    };
    return <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${colors[status] || '#6b7280'}15`, color: colors[status] || '#6b7280' }}>{status.toUpperCase()}</span>;
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}><p>Loading...</p></div>;

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', paddingTop: 80 }}>
        <div className="form-card" style={{ maxWidth: 400, width: '100%', margin: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="logo" style={{ justifyContent: 'center', marginBottom: 16, fontSize: 28 }}><Navigation size={28} /> GaonRide</div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Admin Dashboard</h2>
          </div>
          {loginError && <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>{loginError}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group"><label>Email</label><input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="form-group"><label>Password</label><input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} type="submit">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'overview', label: 'Overview', icon: <Eye size={18} />, count: 0 },
    { key: 'rides', label: 'Rides', icon: <Car size={18} />, count: rides.length },
    { key: 'deliveries', label: 'Deliveries', icon: <Package size={18} />, count: deliveries.length },
    { key: 'events', label: 'Events', icon: <Calendar size={18} />, count: events.length },
    { key: 'partners', label: 'Partners', icon: <Users size={18} />, count: partners.length },
    { key: 'messages', label: 'Messages', icon: <Mail size={18} />, count: messages.length },
  ];

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <div><h1 style={{ fontSize: 28, fontWeight: 800 }}>Admin Dashboard</h1><p style={{ color: 'var(--text-muted)' }}>Nearest partner assignment enabled</p></div>
          <div className="admin-header-actions">
            <button className="btn btn-primary btn-sm" onClick={fetchAllData}><RefreshCw size={16} /> Refresh</button>
            <button className="btn btn-outline btn-sm" style={{ color: 'var(--text)', borderColor: '#e5e7eb' }} onClick={handleLogout}><LogOut size={16} /> Logout</button>
          </div>
        </div>

        <div className="admin-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', background: tab === t.key ? 'var(--primary)' : 'transparent', color: tab === t.key ? 'white' : 'var(--text-muted)' }}
            >
              {t.icon} {t.label} {t.count > 0 && <span style={{ background: tab === t.key ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)', padding: '2px 8px', borderRadius: 20, fontSize: 12 }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="admin-overview-grid">
            {[{ label: 'Rides', count: rides.length, icon: <Car size={24} /> }, { label: 'Deliveries', count: deliveries.length, icon: <Package size={24} /> }, { label: 'Events', count: events.length, icon: <Calendar size={24} /> }, { label: 'Partners', count: partners.length, icon: <Users size={24} /> }, { label: 'Messages', count: messages.length, icon: <Mail size={24} /> }].map((c) => (
              <div key={c.label} style={{ background: 'white', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow)' }}>
                <div style={{ marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 900 }}>{c.count}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'rides' && (
          <DataTable
            title="Ride Bookings"
            data={rides}
            table="ride_bookings"
            columns={['pickup', 'drop_location', 'vehicle', 'phone', 'status', 'assigned_partner_name', 'assigned_distance_km', 'created_at']}
            updateStatus={updateStatus}
            deleteRecord={deleteRecord}
            formatDate={formatDate}
            StatusBadge={StatusBadge}
            partners={partners}
            partnerLocations={partnerLocations}
            assignNearestPartner={assignNearestPartner}
          />
        )}
        {tab === 'deliveries' && (
          <DataTable
            title="Delivery Orders"
            data={deliveries}
            table="delivery_orders"
            columns={['type', 'sender_name', 'delivery_address', 'phone', 'status', 'assigned_partner_name', 'assigned_distance_km', 'created_at']}
            updateStatus={updateStatus}
            deleteRecord={deleteRecord}
            formatDate={formatDate}
            StatusBadge={StatusBadge}
            partners={partners}
            partnerLocations={partnerLocations}
            assignNearestPartner={assignNearestPartner}
          />
        )}
        {tab === 'events' && (
          <DataTable
            title="Event Quotes"
            data={events}
            table="event_quotes"
            columns={['full_name', 'event_type', 'event_date', 'phone', 'address', 'status', 'assigned_partner_name', 'assigned_distance_km', 'created_at']}
            updateStatus={updateStatus}
            deleteRecord={deleteRecord}
            formatDate={formatDate}
            StatusBadge={StatusBadge}
            partners={partners}
            partnerLocations={partnerLocations}
            assignNearestPartner={assignNearestPartner}
          />
        )}
        {tab === 'partners' && <DataTable title="Partner Registrations" data={partners} table="partner_registrations" columns={['full_name', 'village', 'district', 'phone', 'status', 'partner_roles', 'is_available', 'created_at']} updateStatus={updateStatus} deleteRecord={deleteRecord} formatDate={formatDate} StatusBadge={StatusBadge} />}
        {tab === 'messages' && <DataTable title="Contact Messages" data={messages} table="contact_messages" columns={['full_name', 'subject', 'message', 'phone', 'status', 'created_at']} updateStatus={updateStatus} deleteRecord={deleteRecord} formatDate={formatDate} StatusBadge={StatusBadge} statuses={['unread', 'read', 'resolved']} />}
      </div>
    </div>
  );
};

function DataTable({ title, data, table, columns, updateStatus, deleteRecord, formatDate, StatusBadge, statuses, partners, partnerLocations, assignNearestPartner }: any) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [manualPartnerByRow, setManualPartnerByRow] = useState<Record<string, string>>({});
  const defaultStatuses = statuses || ['pending', 'confirmed', 'completed', 'cancelled'];
  const isAssignableTable = table === 'ride_bookings' || table === 'delivery_orders' || table === 'event_quotes';

  const getMatches = (row: any): MatchItem[] => {
    const role = tableToRole(table);
    const requestCoords = getRequestCoords(row, table);
    if (!role || !requestCoords || !partners || !partnerLocations) return [];

    const requestDate = getRequestedDate(row, table);
    const locationByPartnerId: Record<string, any> = {};
    partnerLocations.forEach((loc: any) => {
      locationByPartnerId[loc.partner_id] = loc;
    });

    return partners
      .filter((p: any) => {
        if (p.status !== 'confirmed') return false;
        if (!p.is_available) return false;
        const roles = Array.isArray(p.partner_roles) ? p.partner_roles : ['driver'];
        if (!roles.includes(role)) return false;
        const availableAfter = p.available_after ? new Date(p.available_after) : new Date(0);
        if (availableAfter.getTime() > requestDate.getTime()) return false;
        const loc = locationByPartnerId[p.id];
        return !!loc;
      })
      .map((p: any) => {
        const loc = locationByPartnerId[p.id];
        const partnerCoords = toLatLng(loc.latitude, loc.longitude);
        if (!partnerCoords) return null;
        return {
          partner: p,
          distanceKm: haversineKm(requestCoords, partnerCoords),
          partnerCoords,
          updatedAt: String(loc.updated_at || ''),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
      .slice(0, 5);
  };

  const getManualCandidates = (row: any) => {
    const role = tableToRole(table);
    const requestCoords = getRequestCoords(row, table);
    const locationByPartnerId: Record<string, any> = {};
    (partnerLocations || []).forEach((loc: any) => {
      locationByPartnerId[loc.partner_id] = loc;
    });

    return (partners || [])
      .filter((p: any) => {
        if (p.status !== 'confirmed') return false;
        if (!role) return true;
        const roles = Array.isArray(p.partner_roles) ? p.partner_roles : ['driver'];
        return roles.includes(role);
      })
      .map((p: any) => {
        const loc = locationByPartnerId[p.id];
        const pCoords = loc ? toLatLng(loc.latitude, loc.longitude) : null;
        const dist = requestCoords && pCoords ? haversineKm(requestCoords, pCoords) : null;
        return { partner: p, distanceKm: dist };
      })
      .sort((a: any, b: any) => {
        const ad = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const bd = b.distanceKm ?? Number.POSITIVE_INFINITY;
        return ad - bd;
      });
  };

  return (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{title} ({data.length})</h3>
      {data.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: 60, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>No {title.toLowerCase()} yet.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div className="admin-table-scroll">
            <table className="admin-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {columns.map((col: string) => (
                    <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{col.replace(/_/g, ' ')}</th>
                  ))}
                  <th className="admin-actions-col" style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any) => {
                  const matches = getMatches(row);
                  return (
                    <React.Fragment key={row.id}>
                      <tr style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}>
                        {columns.map((col: string) => (
                          <td key={col} style={{ padding: '12px 16px', fontSize: 14, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {col === 'status' ? <StatusBadge status={row[col]} /> : col === 'created_at' ? formatDate(row[col]) : col === 'assigned_distance_km' ? (typeof row[col] === 'number' ? `${row[col].toFixed(2)} km` : '-') : Array.isArray(row[col]) ? row[col].join(', ') : String(row[col] ?? '-')}
                          </td>
                        ))}
                        <td className="admin-actions-col" style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <select value={row.status} onChange={(e) => { e.stopPropagation(); updateStatus(table, row.id, e.target.value); }} onClick={(e) => e.stopPropagation()} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                              {defaultStatuses.map((s: string) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {isAssignableTable && (
                              <button
                                className="btn btn-outline-accent btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedRow(expandedRow === row.id ? null : row.id);
                                }}
                              >
                                Assign
                              </button>
                            )}
                            <button className="btn btn-outline btn-sm" style={{ color: '#dc2626', borderColor: '#fecaca' }} onClick={(e) => { e.stopPropagation(); deleteRecord(table, row.id); }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === row.id && (
                        <tr>
                          <td colSpan={columns.length + 1} style={{ padding: 20, background: '#f8f9fa' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                              {Object.entries(row).map(([key, value]) => (
                                <div key={key}>
                                  <strong style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{key.replace(/_/g, ' ')}</strong>
                                  <p style={{ fontSize: 14, marginTop: 4 }}>{Array.isArray(value) ? value.join(', ') : String(value ?? '-')}</p>
                                </div>
                              ))}
                            </div>

                            {isAssignableTable && (
                              <div style={{ marginTop: 20, borderTop: '1px dashed #d1d5db', paddingTop: 16 }}>
                                <h4 style={{ marginBottom: 12 }}>Manual Assignment</h4>
                                {(() => {
                                  const candidates = getManualCandidates(row);
                                  const selectedId = manualPartnerByRow[row.id] || '';
                                  return (
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                                      <select
                                        value={selectedId}
                                        onChange={(e) => setManualPartnerByRow((prev) => ({ ...prev, [row.id]: e.target.value }))}
                                        style={{ minWidth: 280, padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}
                                      >
                                        <option value="">Select partner manually</option>
                                        {candidates.map((c: any) => (
                                          <option key={c.partner.id} value={c.partner.id}>
                                            {c.partner.full_name} | {c.partner.phone} | {c.distanceKm == null ? 'distance N/A' : `${c.distanceKm.toFixed(2)} km`} | {c.partner.is_available ? 'available' : 'busy'}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                          if (!selectedId) return;
                                          const selected = candidates.find((c: any) => c.partner.id === selectedId);
                                          if (!selected) return;
                                          assignNearestPartner(table, row, selected.partner, selected.distanceKm ?? undefined);
                                        }}
                                        disabled={!selectedId}
                                      >
                                        Assign Selected
                                      </button>
                                    </div>
                                  );
                                })()}
                                <h4 style={{ marginBottom: 12 }}>Nearest Available Partners</h4>
                                {(() => {
                                  const requestCoords = getRequestCoords(row, table);
                                  if (!requestCoords) return null;
                                  return (
                                    <div style={{ marginBottom: 14, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10 }}>
                                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                                        User Location: {requestCoords.lat.toFixed(5)}, {requestCoords.lng.toFixed(5)}
                                      </div>
                                      <button
                                        className="btn btn-outline-accent btn-sm"
                                        style={{ marginBottom: 8 }}
                                        onClick={async () => {
                                          const shareUrl = googlePointUrl(requestCoords);
                                          try {
                                            await navigator.clipboard.writeText(shareUrl);
                                            alert('Direct map link copied.');
                                          } catch {
                                            prompt('Copy this direct map link:', shareUrl);
                                          }
                                        }}
                                      >
                                        Copy User Location For Partner
                                      </button>
                                      <iframe
                                        title={`admin-user-map-${row.id}`}
                                        src={openStreetMapEmbedUrl(requestCoords)}
                                        style={{ width: '100%', height: 180, border: '1px solid #e5e7eb', borderRadius: 8 }}
                                        loading="lazy"
                                      />
                                    </div>
                                  );
                                })()}
                                {!getRequestCoords(row, table) && (
                                  <div style={{ fontSize: 13, color: '#b45309' }}>User location not available for this booking yet.</div>
                                )}
                                {getRequestCoords(row, table) && matches.length === 0 && (
                                  <div style={{ fontSize: 13, color: '#b45309' }}>No available nearby partners found for required role.</div>
                                )}
                                {matches.length > 0 && (
                                  <div style={{ display: 'grid', gap: 10 }}>
                                    {matches.map((match) => (
                                      <div key={match.partner.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                                          <div>
                                            <div style={{ fontWeight: 700 }}>{match.partner.full_name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{match.partner.phone} | {match.distanceKm.toFixed(2)} km</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Roles: {(match.partner.partner_roles || []).join(', ') || 'driver'}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                              Partner Location: {match.partnerCoords.lat.toFixed(5)}, {match.partnerCoords.lng.toFixed(5)} {match.updatedAt ? `| Updated ${new Date(match.updatedAt).toLocaleTimeString('en-IN')}` : ''}
                                            </div>
                                          </div>
                                          <button className="btn btn-primary btn-sm" onClick={() => assignNearestPartner(table, row, match.partner, match.distanceKm)}>Assign</button>
                                        </div>
                                        {(() => {
                                          const requestCoords = getRequestCoords(row, table);
                                          if (!requestCoords) return null;
                                          return (
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                              <a className="btn btn-outline-accent btn-sm" href={googleDirectionsUrl(match.partnerCoords, requestCoords)} target="_blank" rel="noreferrer">Partner to User Route</a>
                                              <a className="btn btn-outline-accent btn-sm" href={googleDirectionsUrl(requestCoords, match.partnerCoords)} target="_blank" rel="noreferrer">User to Partner Route</a>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {row.assigned_partner_id && (
                                  <div style={{ marginTop: 12, fontSize: 13, color: '#166534' }}>
                                    Currently assigned partner: {row.assigned_partner_name || row.assigned_partner_id}
                                    {(() => {
                                      const req = getRequestCoords(row, table);
                                      const live = (partnerLocations || []).find((x: any) => x.partner_id === row.assigned_partner_id);
                                      const pCoords = live ? toLatLng(live.latitude, live.longitude) : null;
                                      if (!req || !pCoords) return null;
                                      const liveKm = haversineKm(pCoords, req);
                                      return (
                                        <div style={{ marginTop: 8, background: '#fff', border: '1px solid #d1fae5', borderRadius: 8, padding: 8 }}>
                                          <div style={{ fontSize: 12, color: '#065f46' }}>
                                            Live partner distance: {liveKm.toFixed(2)} km | Updated: {live.updated_at ? new Date(live.updated_at).toLocaleTimeString('en-IN') : '-'}
                                          </div>
                                          <a className="btn btn-outline-accent btn-sm" href={googleDirectionsUrl(pCoords, req)} target="_blank" rel="noreferrer" style={{ marginTop: 8 }}>
                                            Open Live Route
                                          </a>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
