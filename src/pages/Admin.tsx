import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { Navigation, Car, Package, Calendar, Users, Mail, LogOut, RefreshCw, Eye, CheckCircle, Clock, ChevronDown } from 'lucide-react';

type Tab = 'overview' | 'rides' | 'deliveries' | 'events' | 'partners' | 'messages';

const AdminPage: React.FC = () => {
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data states
  const [rides, setRides] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

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
    const [r, d, ev, p, m] = await Promise.all([
      supabase.from('ride_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('delivery_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('event_quotes').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
    ]);
    setRides(r.data || []);
    setDeliveries(d.data || []);
    setEvents(ev.data || []);
    setPartners(p.data || []);
    setMessages(m.data || []);
  }, []);

  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = window.setTimeout(() => {
        fetchAllData();
      }, 400);
    };

    const channel = supabase.channel('admin-realtime');
    ['ride_bookings', 'delivery_orders', 'event_quotes', 'partner_registrations', 'contact_messages'].forEach(table => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => scheduleRefresh()
      );
    });

    channel.subscribe();

    const pollId = window.setInterval(() => {
      fetchAllData();
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(pollId);
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [fetchAllData, isLoggedIn]);

  const updateStatus = async (table: string, id: string, status: string) => {
    await supabase.from(table).update({ status }).eq('id', id);
    fetchAllData();
  };

  const deleteRecord = async (table: string, id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this data? This action cannot be undone.');
    if (!confirmed) return;
    const { data, error, count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .eq('id', id)
      .select('id');
    if (error) {
      console.error(error);
      showToast(`❌ Delete failed: ${error.message}`);
      return;
    }
    if (!count || count === 0 || !data || data.length === 0) {
      showToast('❌ Delete failed: no rows removed. Check permissions.');
      return;
    }
    const matches = (row: any) => String(row.id) !== String(id);
    switch (table) {
      case 'ride_bookings':
        setRides(prev => prev.filter(matches));
        break;
      case 'delivery_orders':
        setDeliveries(prev => prev.filter(matches));
        break;
      case 'event_quotes':
        setEvents(prev => prev.filter(matches));
        break;
      case 'partner_registrations':
        setPartners(prev => prev.filter(matches));
        break;
      case 'contact_messages':
        setMessages(prev => prev.filter(matches));
        break;
      default:
        break;
    }
    showToast('Record deleted successfully.');
    fetchAllData();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      pending: '#ff8c00', completed: '#10b981', confirmed: '#3b82f6', cancelled: '#ef4444', unread: '#ff8c00', read: '#10b981'
    };
    return (
      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${colors[status] || '#6b7280'}15`, color: colors[status] || '#6b7280' }}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}><p>Loading...</p></div>;

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', paddingTop: 80 }}>
        <div className="form-card" style={{ maxWidth: 400, width: '100%', margin: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="logo" style={{ justifyContent: 'center', marginBottom: 16, fontSize: 28 }}>
              <Navigation size={28} /> GaonRide
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Admin Dashboard</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>Sign in with your admin account</p>
          </div>
          {loginError && <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>{loginError}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@gaonride.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} type="submit">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  // DASHBOARD
  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'overview', label: 'Overview', icon: <Eye size={18} />, count: 0 },
    { key: 'rides', label: 'Rides', icon: <Car size={18} />, count: rides.length },
    { key: 'deliveries', label: 'Deliveries', icon: <Package size={18} />, count: deliveries.length },
    { key: 'events', label: 'Events', icon: <Calendar size={18} />, count: events.length },
    { key: 'partners', label: 'Partners', icon: <Users size={18} />, count: partners.length },
    { key: 'messages', label: 'Messages', icon: <Mail size={18} />, count: messages.length },
  ];

  const overviewCards = [
    { label: 'Ride Bookings', count: rides.length, pending: rides.filter(r => r.status === 'pending').length, color: '#3b82f6', icon: <Car size={24} /> },
    { label: 'Deliveries', count: deliveries.length, pending: deliveries.filter(r => r.status === 'pending').length, color: '#10b981', icon: <Package size={24} /> },
    { label: 'Event Quotes', count: events.length, pending: events.filter(r => r.status === 'pending').length, color: '#f59e0b', icon: <Calendar size={24} /> },
    { label: 'Partners', count: partners.length, pending: partners.filter(r => r.status === 'pending').length, color: '#8b5cf6', icon: <Users size={24} /> },
    { label: 'Messages', count: messages.length, pending: messages.filter(r => r.status === 'unread').length, color: '#ef4444', icon: <Mail size={24} /> },
  ];

  return (
    <div className="admin-page">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800 }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage all GaonRide submissions</p>
          </div>
          <div className="admin-header-actions">
            <button className="btn btn-primary btn-sm" onClick={fetchAllData}><RefreshCw size={16} /> Refresh</button>
            <button className="btn btn-outline btn-sm" style={{ color: 'var(--text)', borderColor: '#e5e7eb' }} onClick={handleLogout}><LogOut size={16} /> Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap',
                background: tab === t.key ? 'var(--primary)' : 'transparent', color: tab === t.key ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}>
              {t.icon} {t.label} {t.count > 0 && <span style={{ background: tab === t.key ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)', padding: '2px 8px', borderRadius: 20, fontSize: 12 }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div className="admin-overview-grid">
              {overviewCards.map((c, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow)', cursor: 'pointer' }}
                  onClick={() => setTab(tabs[i + 1].key)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>{c.icon}</div>
                    {c.pending > 0 && <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#fff3cd', color: '#856404' }}>{c.pending} pending</span>}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: c.color }}>{c.count}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{c.label}</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Recent Activity</h3>
            <div style={{ background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
              {[...rides.slice(0, 3).map(r => ({ ...r, _type: 'Ride', _table: 'ride_bookings' })),
                ...deliveries.slice(0, 2).map(r => ({ ...r, _type: 'Delivery', _table: 'delivery_orders' })),
                ...events.slice(0, 2).map(r => ({ ...r, _type: 'Event', _table: 'event_quotes' })),
              ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8).map((item, i) => (
                <div key={i} className="admin-activity-row">
                  <div>
                    <span style={{ fontWeight: 600 }}>{item._type}</span>
                    <span className="admin-activity-meta">
                      {item.phone || item.full_name || 'N/A'} — {formatDate(item.created_at)}
                    </span>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
              {rides.length + deliveries.length + events.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No submissions yet. Data will appear here once forms are submitted.</div>
              )}
            </div>
          </div>
        )}

        {/* DATA TABLES */}
        {tab === 'rides' && <DataTable title="Ride Bookings" data={rides} table="ride_bookings" columns={['pickup', 'drop_location', 'vehicle', 'phone', 'status', 'created_at']} updateStatus={updateStatus} deleteRecord={deleteRecord} formatDate={formatDate} StatusBadge={StatusBadge} />}
        {tab === 'deliveries' && <DataTable title="Delivery Orders" data={deliveries} table="delivery_orders" columns={['type', 'sender_name', 'delivery_address', 'phone', 'status', 'created_at']} updateStatus={updateStatus} deleteRecord={deleteRecord} formatDate={formatDate} StatusBadge={StatusBadge} />}
        {tab === 'events' && <DataTable title="Event Quotes" data={events} table="event_quotes" columns={['full_name', 'event_type', 'event_date', 'phone', 'status', 'created_at']} updateStatus={updateStatus} deleteRecord={deleteRecord} formatDate={formatDate} StatusBadge={StatusBadge} />}
        {tab === 'partners' && <DataTable title="Partner Registrations" data={partners} table="partner_registrations" columns={['full_name', 'village', 'district', 'phone', 'status', 'created_at']} updateStatus={updateStatus} deleteRecord={deleteRecord} formatDate={formatDate} StatusBadge={StatusBadge} />}
        {tab === 'messages' && <DataTable title="Contact Messages" data={messages} table="contact_messages" columns={['full_name', 'subject', 'message', 'phone', 'status', 'created_at']} updateStatus={updateStatus} deleteRecord={deleteRecord} formatDate={formatDate} StatusBadge={StatusBadge} statuses={['unread', 'read', 'resolved']} />}
      </div>
    </div>
  );
};

// Reusable data table component
function DataTable({ title, data, table, columns, updateStatus, deleteRecord, formatDate, StatusBadge, statuses }: any) {
  const defaultStatuses = statuses || ['pending', 'confirmed', 'completed', 'cancelled'];
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700 }}>{title} ({data.length})</h3>
      </div>

      {data.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: 60, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>No {title.toLowerCase()} yet.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div className="admin-table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {columns.map((col: string) => (
                    <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any) => (
                  <React.Fragment key={row.id}>
                    <tr style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}>
                      {columns.map((col: string) => (
                        <td key={col} style={{ padding: '12px 16px', fontSize: 14, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {col === 'status' ? <StatusBadge status={row[col]} /> : col === 'created_at' ? formatDate(row[col]) : String(row[col] || '—')}
                        </td>
                      ))}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <select value={row.status} onChange={e => { e.stopPropagation(); updateStatus(table, row.id, e.target.value); }}
                            onClick={e => e.stopPropagation()}
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {defaultStatuses.map((s: string) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: '#dc2626', borderColor: '#fecaca' }}
                            onClick={e => { e.stopPropagation(); deleteRecord(table, row.id); }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === row.id && (
                      <tr><td colSpan={columns.length + 1} style={{ padding: 24, background: '#f8f9fa' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                          {Object.entries(row).filter(([k]) => k !== 'id' && k !== '_type' && k !== '_table').map(([k, v]) => (
                            <div key={k}><strong style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</strong>
                              <p style={{ fontSize: 14, marginTop: 4 }}>{Array.isArray(v) ? (v as string[]).join(', ') : String(v || '—')}</p>
                            </div>
                          ))}
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
