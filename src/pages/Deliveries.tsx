import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Package, ShoppingCart, Clock, MapPin, Shield, ChevronDown, Truck, Box, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useLanguage } from '../components/LanguageContext';
import { supabase } from '../lib/supabase';
import { addPendingConfirmation, requestBrowserNotificationPermission, useConfirmationNotifications } from '../hooks/useConfirmationNotifications';
import { estimateEtaMinutes, googleDirectionsUrl, haversineKm, openStreetMapEmbedUrl, toLatLng } from '../lib/geo';

gsap.registerPlugin(ScrollTrigger);

const DeliveriesPage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [tab, setTab] = useState<'parcel' | 'grocery'>('parcel');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [trackPhone, setTrackPhone] = useState('');
  const [trackResults, setTrackResults] = useState<any[] | null>(null);
  const [tracking, setTracking] = useState(false);
  const [requestCoords, setRequestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [partnerLiveById, setPartnerLiveById] = useState<Record<string, { latitude: number; longitude: number; updated_at: string }>>({});
  const [updatingUserLocId, setUpdatingUserLocId] = useState<string | null>(null);

  useConfirmationNotifications({ table: 'delivery_orders', label: 'Delivery', showToast });

  useEffect(() => {
    window.scrollTo(0, 0);
    gsap.fromTo('.del-hero', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 });
  }, []);

  const captureRequestLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported in this browser.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setRequestCoords({ lat: coords.latitude, lng: coords.longitude });
      setLocationLoading(false);
      showToast('Delivery location captured.');
    }, () => {
      setLocationLoading(false);
      showToast('Could not capture location.');
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const handleTrack = async () => {
    if (!trackPhone.trim()) return;
    setTracking(true);
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('id, type, delivery_address, status, created_at, request_lat, request_lng, user_live_lat, user_live_lng, user_live_updated_at, assigned_partner_id, assigned_partner_name, assigned_partner_phone, assigned_distance_km')
        .eq('phone', trackPhone.trim())
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      setTrackResults(data || []);
    } catch {
      showToast('Error tracking. Please try again.');
      setTrackResults(null);
    }
    setTracking(false);
  };

  useEffect(() => {
    if (!trackResults || trackResults.length === 0) return;
    const channel = supabase
      .channel('delivery-tracking')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'delivery_orders', filter: `phone=eq.${trackPhone.trim()}` }, (payload) => {
        setTrackResults((prev) => prev?.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } : r)) || null);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackResults, trackPhone]);

  useEffect(() => {
    const assignedIds = (trackResults || []).map((r: any) => r.assigned_partner_id).filter((v: string | null) => !!v);
    if (!assignedIds.length) {
      setPartnerLiveById({});
      return;
    }

    const loadLocations = async () => {
      const { data } = await supabase
        .from('partner_live_locations')
        .select('partner_id, latitude, longitude, updated_at')
        .in('partner_id', assignedIds);
      const next: Record<string, { latitude: number; longitude: number; updated_at: string }> = {};
      (data || []).forEach((row: any) => {
        next[row.partner_id] = {
          latitude: row.latitude,
          longitude: row.longitude,
          updated_at: row.updated_at,
        };
      });
      setPartnerLiveById(next);
    };

    loadLocations();
    const pollId = window.setInterval(loadLocations, 8000);
    return () => window.clearInterval(pollId);
  }, [trackResults]);

  const updateUserLiveLocation = (orderId: string) => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported in this browser.');
      return;
    }
    setUpdatingUserLocId(orderId);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          user_live_lat: coords.latitude,
          user_live_lng: coords.longitude,
          user_live_updated_at: nowIso,
        })
        .eq('id', orderId);
      setUpdatingUserLocId(null);
      if (error) {
        showToast(`Could not update your location: ${error.message}`);
        return;
      }
      setTrackResults((prev) => prev?.map((row: any) => row.id === orderId ? { ...row, user_live_lat: coords.latitude, user_live_lng: coords.longitude, user_live_updated_at: nowIso } : row) || null);
      showToast('Your live location was updated.');
    }, () => {
      setUpdatingUserLocId(null);
      showToast('Location permission denied.');
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestCoords) {
      showToast('Location sharing is mandatory. Tap "Use Current Location" first.');
      return;
    }
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .insert({
          type: tab,
          sender_name: (formData.get('sender_name') as string) || null,
          pickup_address: (formData.get('pickup_address') as string) || null,
          delivery_address: (formData.get('delivery_address') as string) || '',
          parcel_type: (formData.get('parcel_type') as string) || null,
          grocery_list: (formData.get('grocery_list') as string) || null,
          preferred_time: (formData.get('preferred_time') as string) || null,
          preferred_date: (formData.get('preferred_date') as string) || null,
          phone: (formData.get('phone') as string) || '',
          request_lat: requestCoords?.lat ?? null,
          request_lng: requestCoords?.lng ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      if (data?.id) addPendingConfirmation('delivery_orders', String(data.id));
      requestBrowserNotificationPermission();
      showToast(tab === 'parcel' ? 'Parcel pickup scheduled! We will notify you when it is confirmed.' : 'Grocery order placed! We will notify you when it is confirmed.');
      form.reset();
      setRequestCoords(null);
    } catch (err) {
      showToast('Error submitting. Please try again.');
      console.error(err);
    }
  };

  const faqs = [
    { q: 'How fast can you deliver?', a: 'Within village: 30-60 min. Village to town: 2-4 hours. Longer distances: next day.' },
    { q: 'What items can I send?', a: 'Documents, clothes, electronics, food, medicines and more. No hazardous items.' },
    { q: 'How do I track my delivery?', a: 'You can track using the phone number used during booking.' },
  ];

  return (
    <>
      <section className="hero" style={{ minHeight: '60vh', position: 'relative' }}>
        <div className="hero-bg"><img src="/village_delivery_hero.png" alt="Village Delivery" /></div>
        <div className="hero-overlay" />
        <div className="container">
          <div className="del-hero hero-content" style={{ paddingTop: 140 }}>
            <p style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Delivered to Your Doorstep</p>
            <h1>Parcel & <span className="highlight">Grocery</span> Delivery</h1>
            <p>Send parcels anywhere or order fresh groceries from the nearest mandi.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ marginTop: -60, position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 0, marginBottom: 40, background: '#f3f4f6', borderRadius: 'var(--radius-full)', padding: 4, maxWidth: 400, marginInline: 'auto' }}>
            <button onClick={() => setTab('parcel')} className={`btn ${tab === 'parcel' ? 'btn-primary' : ''}`} style={{ flex: 1, justifyContent: 'center', background: tab === 'parcel' ? undefined : 'transparent', color: tab === 'parcel' ? 'white' : 'var(--text)', boxShadow: tab === 'parcel' ? undefined : 'none' }}><Package size={18} /> Parcel</button>
            <button onClick={() => setTab('grocery')} className={`btn ${tab === 'grocery' ? 'btn-primary' : ''}`} style={{ flex: 1, justifyContent: 'center', background: tab === 'grocery' ? undefined : 'transparent', color: tab === 'grocery' ? 'white' : 'var(--text)', boxShadow: tab === 'grocery' ? undefined : 'none' }}><ShoppingCart size={18} /> Grocery</button>
          </div>

          <div className="grid-2">
            <div className="form-card" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
              <h3>{tab === 'parcel' ? 'Send a Parcel' : 'Order Groceries'}</h3>
              <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
                {tab === 'parcel' ? (
                  <>
                    <div className="form-group"><label>Sender Name</label><input name="sender_name" className="form-input" placeholder="Your name" required /></div>
                    <div className="form-row">
                      <div className="form-group"><label>Pickup Address</label><input name="pickup_address" className="form-input" placeholder="Village / Landmark" required /></div>
                      <div className="form-group"><label>Delivery Address</label><input name="delivery_address" className="form-input" placeholder="Destination" required /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Parcel Type</label><select name="parcel_type" className="form-input"><option>Documents</option><option>Small Package (&lt;5kg)</option><option>Medium (5-20kg)</option><option>Large/Heavy (20kg+)</option><option>Food Items</option><option>Medicine</option></select></div>
                      <div className="form-group"><label>Phone</label><input name="phone" className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" required /></div>
                    </div>
                    <div className="form-group"><label>Preferred Date (Optional)</label><input name="preferred_date" className="form-input" type="date" /></div>
                  </>
                ) : (
                  <>
                    <div className="form-group"><label>Your Name</label><input name="sender_name" className="form-input" placeholder="Full name" required /></div>
                    <div className="form-group"><label>Delivery Address</label><input name="delivery_address" className="form-input" placeholder="Village / House" required /></div>
                    <div className="form-group"><label>Grocery List</label><textarea name="grocery_list" className="form-input" placeholder="E.g. 2kg tomatoes, 1kg rice..." rows={4} style={{ resize: 'vertical' }} required /></div>
                    <div className="form-row">
                      <div className="form-group"><label>Preferred Time</label><select name="preferred_time" className="form-input"><option>Morning (8am-12pm)</option><option>Afternoon (12-4pm)</option><option>Evening (4-8pm)</option><option>ASAP</option></select></div>
                      <div className="form-group"><label>Phone</label><input name="phone" className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" required /></div>
                    </div>
                    <div className="form-group"><label>Preferred Date (Optional)</label><input name="preferred_date" className="form-input" type="date" /></div>
                  </>
                )}
                <div style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-outline-accent btn-sm" onClick={captureRequestLocation}>{locationLoading ? 'Locating...' : 'Use Current Location'}</button>
                  {requestCoords && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{requestCoords.lat.toFixed(5)}, {requestCoords.lng.toFixed(5)}</span>}
                </div>
                {!requestCoords && (
                  <p style={{ marginBottom: 12, fontSize: 12, color: '#b45309' }}>
                    Location sharing is mandatory for nearest partner assignment.
                  </p>
                )}
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} type="submit">{tab === 'parcel' ? 'Schedule Pickup' : 'Place Order'} <ArrowRight size={18} /></button>
              </form>
            </div>

            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{tab === 'parcel' ? 'Send Anything, Anywhere' : 'Fresh from the Mandi'}</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>{tab === 'parcel' ? 'Our delivery partners pick up from your doorstep and deliver safely.' : 'We source from local markets for the freshest produce at best prices.'}</p>
              {(tab === 'parcel'
                ? [
                    { icon: <Truck size={24} />, title: 'Same-Day Delivery', desc: 'Within 30km, same-day service available.' },
                    { icon: <Shield size={24} />, title: 'Insured Parcels', desc: 'Parcels above Rs 500 are automatically insured.' },
                    { icon: <MapPin size={24} />, title: 'Real-Time Tracking', desc: 'Track partner location and distance in real time.' },
                    { icon: <Clock size={24} />, title: 'Flexible Timing', desc: 'Schedule morning, afternoon, or evening slots.' },
                  ]
                : [
                    { icon: <Box size={24} />, title: 'Farm Fresh', desc: 'Sourced directly from local farms and mandis.' },
                    { icon: <CheckCircle size={24} />, title: 'All Essentials', desc: 'Rice, dal, oil, spices, snacks in one order.' },
                    { icon: <Shield size={24} />, title: 'Quality Checked', desc: 'Every item inspected before delivery.' },
                    { icon: <Clock size={24} />, title: 'Within 2 Hours', desc: 'Most orders delivered in under 2 hours.' },
                  ]).map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'start' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,77,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>{item.icon}</div>
                  <div><h4 style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</h4><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{item.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 700 }}>
          <div className="section-header"><h2>{t('track.title')}</h2><p>{t('track.subtitle')}</p></div>
          <div className="form-card" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <input className="form-input" type="tel" placeholder={t('track.placeholder')} value={trackPhone} onChange={(e) => setTrackPhone(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={handleTrack} disabled={tracking}>{tracking ? '...' : `Track`}</button>
            </div>
            {trackResults && trackResults.length > 0 && (
              <div style={{ marginTop: 24 }}>
                {trackResults.map((r: any, i: number) => (
                  <div key={i} className="track-result-card">
                    <div className="track-header">
                      <div className="track-type"><span>{r.type === 'parcel' ? 'Parcel' : 'Grocery'}</span></div>
                      <span className={`track-status status-${r.status}`}>{r.status}</span>
                    </div>
                    <div className="track-details">
                      <div className="track-field"><span>To:</span><span>{r.delivery_address || '-'}</span></div>
                      <div className="track-field" style={{ textAlign: 'right' }}><span>Placed:</span><span>{new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
                    </div>
                    {r.assigned_partner_id && (
                      <div style={{ marginTop: 12, borderTop: '1px dashed #e2e8f0', paddingTop: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                          Assigned Partner: {r.assigned_partner_name || 'Partner'} ({r.assigned_partner_phone || 'phone unavailable'})
                        </div>
                        {typeof r.assigned_distance_km === 'number' && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                            Estimated distance at assignment: {r.assigned_distance_km.toFixed(2)} km
                          </div>
                        )}
                        {(() => {
                          const userCoords = toLatLng(r.user_live_lat, r.user_live_lng) || toLatLng(r.request_lat, r.request_lng);
                          const live = partnerLiveById[r.assigned_partner_id];
                          const partnerCoords = live ? toLatLng(live.latitude, live.longitude) : null;
                          if (!userCoords || !partnerCoords) return null;
                          const liveDistance = haversineKm(partnerCoords, userCoords);
                          const etaMins = estimateEtaMinutes(liveDistance, 22);
                          return (
                            <div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                                Live distance now: {liveDistance.toFixed(2)} km | ETA: ~{etaMins} min | Updated: {new Date(live.updated_at).toLocaleTimeString('en-IN')}
                              </div>
                              <iframe title={`delivery-map-${r.id}`} src={openStreetMapEmbedUrl(partnerCoords)} style={{ width: '100%', height: 220, border: '1px solid #e2e8f0', borderRadius: 12 }} loading="lazy" />
                              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                <a className="btn btn-outline-accent btn-sm" href={googleDirectionsUrl(partnerCoords, userCoords)} target="_blank" rel="noreferrer">Partner to User Route</a>
                                <a className="btn btn-outline-accent btn-sm" href={googleDirectionsUrl(userCoords, partnerCoords)} target="_blank" rel="noreferrer">User to Partner Route</a>
                                <button className="btn btn-outline-accent btn-sm" onClick={() => updateUserLiveLocation(r.id)} disabled={updatingUserLocId === r.id}>
                                  {updatingUserLocId === r.id ? 'Updating...' : 'Update My Live Location'}
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {trackResults && trackResults.length === 0 && <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-muted)' }}>{t('track.noResults')}</p>}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-header"><h2>Delivery <span>FAQ</span></h2></div>
          {faqs.map((f, i) => (
            <div className="faq-item" key={i}>
              <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>{f.q}<ChevronDown size={20} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} /></button>
              {openFaq === i && <div className="faq-answer">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default DeliveriesPage;
