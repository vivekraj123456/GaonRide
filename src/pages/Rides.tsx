import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Car, MapPin, Clock, Shield, Star, ChevronDown, IndianRupee,
  Fuel, Users, Navigation, Bike, Truck as TruckIcon
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { useLanguage } from '../components/LanguageContext';
import { supabase } from '../lib/supabase';
import { addPendingConfirmation, requestBrowserNotificationPermission, useConfirmationNotifications } from '../hooks/useConfirmationNotifications';

gsap.registerPlugin(ScrollTrigger);

const vehicles = [
  { id: 'auto', name: 'Auto Rickshaw', icon: <Navigation size={32} />, price: '₹10/km', capacity: '3 passengers', desc: 'Classic green-yellow auto for short village-to-town trips. Affordable and always available.', features: ['GPS Tracked', 'Rain Cover', 'Luggage Space'], popular: true },
  { id: 'bolero', name: 'Bolero / SUV', icon: <Car size={32} />, price: '₹15/km', capacity: '6 passengers', desc: 'Comfortable Mahindra Bolero for family trips, hospital visits, or longer journeys.', features: ['AC Available', 'Music System', 'Spacious Boot'], popular: false },
  { id: 'bike', name: 'Bike Taxi', icon: <Bike size={32} />, price: '₹7/km', capacity: '1 passenger', desc: 'Quick bike rides for solo travellers. Beat the traffic and reach fast.', features: ['Helmet Provided', 'Fastest Option', 'Low Cost'], popular: false },
  { id: 'tractor', name: 'Tractor / Pickup', icon: <TruckIcon size={32} />, price: '₹20/km', capacity: 'Heavy Goods', desc: 'For agricultural goods, building materials, or heavy cargo within and between villages.', features: ['Heavy Duty', 'Large Capacity', 'Experienced Drivers'], popular: false },
];

const RidesPage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [selectedVehicle, setSelectedVehicle] = useState('auto');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({ pickup: '', drop: '', vehicle: 'auto', date: '', phone: '' });
  const [trackPhone, setTrackPhone] = useState('');
  const [trackResults, setTrackResults] = useState<any[] | null>(null);
  const [tracking, setTracking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useConfirmationNotifications({ table: 'ride_bookings', label: 'Ride', showToast });

  useEffect(() => {
    window.scrollTo(0, 0);
    gsap.fromTo('.ride-hero-content', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 });
    
    document.querySelectorAll('.card-3d').forEach((card, i) => {
      gsap.fromTo(card, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.6, delay: i * 0.1,
        scrollTrigger: { trigger: card, start: 'top 85%' }
      });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('ride_bookings').insert({
        pickup: formData.pickup,
        drop_location: formData.drop,
        vehicle: formData.vehicle,
        phone: formData.phone,
        preferred_date: formData.date || null,
      }).select().single();
      if (error) throw error;
      if (data?.id) addPendingConfirmation('ride_bookings', String(data.id));
      requestBrowserNotificationPermission();
      showToast('Ride booked successfully! We will notify you when it is confirmed.');
      setFormData({ pickup: '', drop: '', vehicle: 'auto', date: '', phone: '' });
    } catch (err) {
      showToast('❌ Error booking ride. Please try again.');
      console.error(err);
    }
    setSubmitting(false);
  };
 
  const handleTrack = async () => {
    if (!trackPhone.trim()) return;
    setTracking(true);
    try {
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('id, pickup, drop_location, status, created_at, vehicle')
        .eq('phone', trackPhone.trim())
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      setTrackResults(data || []);
    } catch {
      showToast('❌ Error tracking. Please try again.');
      setTrackResults(null);
    }
    setTracking(false);
  };
 
  useEffect(() => {
    if (!trackResults || trackResults.length === 0) return;
    const channel = supabase.channel('rides-tracking')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ride_bookings', filter: `phone=eq.${trackPhone.trim()}` }, (payload) => {
        setTrackResults(prev => prev?.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r) || null);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [trackResults, trackPhone]);

  const faqs = [
    { q: 'How do I book a ride?', a: 'Simply fill in the booking form above with your pickup and drop location, select a vehicle type, and submit. Our nearest driver will contact you within 2 minutes.' },
    { q: 'What payment methods are accepted?', a: 'We accept cash, UPI (Google Pay, PhonePe, Paytm), and bank transfer. Pay however is convenient for you.' },
    { q: 'Is there a cancellation fee?', a: 'No cancellation fee if you cancel within 5 minutes of booking. After that, a small ₹20 fee applies to compensate the driver.' },
    { q: 'Are rides available 24/7?', a: 'Yes! Our drivers are available round the clock. However, availability may vary in very remote areas after midnight.' },
    { q: 'Can I book a ride for someone else?', a: 'Absolutely! Just enter their pickup location and phone number. We\'ll coordinate directly with them.' },
  ];

  return (
    <>
      {/* HERO */}
      <section className="hero" style={{ minHeight: '60vh', position: 'relative' }}>
        <div className="hero-bg"><img src="/ride3.png" alt="Rides" /></div>
        <div className="hero-overlay" />
        <div className="container">
          <div className="ride-hero-content hero-content" style={{ paddingTop: 140 }}>
            <p style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
              🚗 Village to City, Anytime
            </p>
            <h1>Book Your <span className="highlight">Ride</span></h1>
            <p>Choose from Auto Rickshaws, Bolero SUVs, Bike Taxis, or Tractors. Safe, affordable, and always on time.</p>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 5, pointerEvents: 'none' }}>
          <svg viewBox="0 0 1440 320" style={{ display: 'block', width: '100%', height: '80px' }} preserveAspectRatio="none">
            <path fill="#ffffff" fillOpacity="1" d="M0,224 C320,64 960,352 1440,128 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </section>

      {/* BOOKING FORM */}
      <section className="section" style={{ marginTop: -60, position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div className="grid-2">
            <div className="form-card" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
              <h3>📍 Where are you going?</h3>
              <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
                <div className="form-group">
                  <label>Pickup Location</label>
                  <input className="form-input" type="text" placeholder="Village name, landmark, or address" 
                    value={formData.pickup} onChange={e => setFormData({...formData, pickup: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Drop Location</label>
                  <input className="form-input" type="text" placeholder="Where do you want to go?" 
                    value={formData.drop} onChange={e => setFormData({...formData, drop: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vehicle Type</label>
                    <select className="form-input" value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})}>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} — {v.price}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" 
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Preferred Date & Time (Optional)</label>
                  <input className="form-input" type="datetime-local" 
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} type="submit">
                  Find Ride <Navigation size={18} />
                </button>
              </form>
            </div>

            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>
                Why book with <span style={{ color: 'var(--primary)' }}>GaonRide?</span>
              </h2>
              {[
                { icon: <Shield size={24} />, title: 'Verified Drivers', desc: 'Every driver undergoes Aadhaar verification and background checks.' },
                { icon: <IndianRupee size={24} />, title: 'Transparent Pricing', desc: 'See the fare before you book. No surge pricing, no hidden fees.' },
                { icon: <Clock size={24} />, title: '2-Minute Pickup', desc: 'Average pickup time under 5 minutes in covered areas.' },
                { icon: <Star size={24} />, title: '4.8★ Average Rating', desc: 'Our drivers maintain high standards of service and cleanliness.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'start' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,77,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VEHICLE CARDS */}
      <section className="section section-alt" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-5%', top: '10%', opacity: 0.03, zIndex: 0, pointerEvents: 'none' }}>
          <svg width="600" height="600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="var(--primary)" d="M51.9,-71.6C66,-61.7,75.3,-45.5,80.1,-28.2C84.9,-10.9,85.2,7.5,79.2,23.9C73.2,40.3,60.9,54.7,46.1,63.9C31.3,73.1,14,77.1,-2.4,80.4C-18.8,83.7,-37.6,86.3,-52.1,78C-66.6,69.7,-76.8,48.5,-81.8,27.1C-86.8,5.7,-86.7,-14.9,-78.7,-31.6C-70.7,-48.3,-54.8,-61.1,-39.1,-70.4C-23.4,-79.7,-7.9,-85.5,7.9,-95.9C23.7,-106.3,37.8,-81.5,51.9,-71.6Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header">
            <h2>Choose Your <span>Vehicle</span></h2>
            <p>We have the right ride for every journey, every budget.</p>
          </div>
          <div className="grid-4">
            {vehicles.map((v, i) => (
              <div
                className={`card-3d`}
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                style={{
                  padding: 28, cursor: 'pointer',
                  border: selectedVehicle === v.id ? '2px solid var(--primary)' : '2px solid transparent',
                  position: 'relative'
                }}
              >
                {v.popular && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--accent)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    POPULAR
                  </div>
                )}
                <div style={{ color: 'var(--primary)', marginBottom: 16 }}>{v.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{v.name}</h3>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', marginBottom: 4 }}>{v.price}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{v.capacity}</div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>{v.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {v.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)' }}>
                      <Star size={12} fill="var(--accent)" color="var(--accent)" /> {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TABLE */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Simple & <span>Transparent</span> Pricing</h2>
            <p>No hidden charges. What you see is what you pay.</p>
          </div>
          <div className="grid-3">
            {[
              { name: 'Short Trip', price: '₹50', sub: 'up to 5 km', features: ['Within village limits', 'Auto or Bike', 'Instant booking', 'Cash or UPI'], featured: false },
              { name: 'Town Trip', price: '₹150', sub: '5–15 km', features: ['Village to nearby town', 'Auto, Bolero, or Bike', 'AC available (Bolero)', 'Return trip discount'], featured: true },
              { name: 'City Trip', price: '₹400', sub: '15–50 km', features: ['Village to district city', 'Bolero SUV recommended', 'AC & music system', 'Multiple stops allowed'], featured: false },
            ].map((p, i) => (
              <div className={`price-card ${p.featured ? 'featured' : ''}`} key={i}>
                <h3 style={{ fontWeight: 700, fontSize: 20 }}>{p.name}</h3>
                <div className="price-amount">{p.price}<small> / starting</small></div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{p.sub}</p>
                <ul className="price-features">
                  {p.features.map(f => <li key={f}>✓ {f}</li>)}
                </ul>
                <button className={`btn ${p.featured ? 'btn-primary' : 'btn-accent'}`} style={{ width: '100%' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-alt">
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-header">
            <h2>Frequently Asked <span>Questions</span></h2>
          </div>
          {faqs.map((f, i) => (
            <div className="faq-item" key={i}>
              <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.q}
                <ChevronDown size={20} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
              </button>
              {openFaq === i && <div className="faq-answer">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>
 
      {/* TRACK RIDE */}
      <section className="section">
        <div className="container" style={{maxWidth:700}}>
          <div className="section-header">
            <h2>{t('track.title')}</h2>
            <p>{t('track.subtitle')}</p>
          </div>
          <div className="form-card" style={{boxShadow:'0 20px 60px rgba(0,0,0,0.12)'}}>
            <div style={{display:'flex',gap:12}}>
              <input
                className="form-input"
                type="tel"
                placeholder={t('track.placeholder')}
                value={trackPhone}
                onChange={e => setTrackPhone(e.target.value)}
                style={{flex:1}}
              />
              <button className="btn btn-primary" onClick={handleTrack} disabled={tracking}>
                {tracking ? '...' : `🔍 ${t('track.button')}`}
              </button>
            </div>
            {trackResults && trackResults.length > 0 && (
              <div style={{marginTop:24}}>
                {trackResults.map((r: any, i: number) => (
                  <div key={i} className="track-result-card">
                    <div className="track-header">
                      <div className="track-type">
                        <span>🚗</span>
                        {r.vehicle?.toUpperCase() || 'RIDE'}
                      </div>
                      <span className={`track-status status-${r.status}`}>
                        {r.status === 'confirmed' ? `✅ ${t('track.status.confirmed')}` : 
                         r.status === 'completed' ? `🏁 ${t('track.status.completed')}` : 
                         r.status === 'cancelled' ? `❌ ${t('track.status.cancelled')}` : 
                         `⏳ ${t('track.status.pending')}`}
                      </span>
                    </div>
                    
                    <div className="track-details">
                      <div className="track-field">
                        <span>From:</span>
                        <span>{r.pickup}</span>
                      </div>
                      <div className="track-field">
                        <span>To:</span>
                        <span>{r.drop_location}</span>
                      </div>
                      <div className="track-field" style={{ textAlign: 'right' }}>
                        <span>Booked:</span>
                        <span>{new Date(r.created_at).toLocaleString('en-IN', {dateStyle:'medium',timeStyle:'short'})}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {trackResults && trackResults.length === 0 && (
              <p style={{marginTop:20,textAlign:'center',color:'var(--text-muted)'}}>{t('track.noResults')}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default RidesPage;
