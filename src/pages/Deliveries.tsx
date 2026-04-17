import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Package, ShoppingCart, Clock, MapPin, Shield, ChevronDown, Truck, Box, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useLanguage } from '../components/LanguageContext';
import { supabase } from '../lib/supabase';
import { addPendingConfirmation, requestBrowserNotificationPermission, useConfirmationNotifications } from '../hooks/useConfirmationNotifications';
import { estimateEtaMinutes, googleDirectionsUrl, haversineKm, openStreetMapEmbedUrl, toLatLng } from '../lib/geo';
import { Tilt3D } from '../components/Effects3D';

gsap.registerPlugin(ScrollTrigger);

const DeliveriesPage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [tab, setTab] = useState<'parcel' | 'grocery'>('parcel');
  const [partnerLiveById, setPartnerLiveById] = useState<Record<string, { latitude: number; longitude: number; updated_at: string }>>({});
  const [updatingUserLocId, setUpdatingUserLocId] = useState<string | null>(null);
  const [requestCoords, setRequestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: 'How fast is the parcel delivery?', a: 'Within a village or nearby town (up to 30km), we offer same-day delivery if booked before 2 PM. For longer distances, it takes 24-48 hours.' },
    { q: 'Are groceries delivered from a specific store?', a: 'We source from local mandis and verified shops in your nearest town to ensure the freshest quality and best local prices.' },
    { q: 'Is there a weight limit for parcels?', a: 'Our regular partners can carry up to 20kg on bikes/autos. For heavier loads, please select "Large/Heavy" and we will send a pickup or tractor.' },
    { q: 'Can I track my delivery in real time?', a: 'Yes! Once a partner is assigned, you will receive a tracking link to see their live location and estimated time of arrival.' },
    { q: 'What happens if my parcel is damaged?', a: 'All parcels above ₹500 value are automatically insured. In case of damage, we offer full reimbursement after verification.' },
  ];

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

  return (
    <>
      <section className="hero" style={{ minHeight: '60vh', position: 'relative' }}>
        <div className="hero-bg"><img src="/village_delivery_hero.png" alt="Village Delivery" /></div>
        <div className="hero-overlay" />
        <div className="container">
          <div className="del-hero hero-content" style={{ paddingTop: 140, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Delivered to Your Doorstep</p>
            <h1>Parcel & <span className="highlight">Grocery</span> Delivery</h1>
            <p style={{ maxWidth: 600, margin: '0 auto' }}>Send parcels anywhere or order fresh groceries from the nearest mandi.</p>
          </div>
        </div>
      </section>

      <section className="split-form-section">
        <div className="container">
          <div className="split-form-grid">
            <div className="split-form-content">
              <div style={{ display: 'flex', gap: 0, marginBottom: 32, background: '#f9fafb', borderRadius: 8, padding: 4, border: '1px solid #eaecf0' }}>
                <button onClick={() => setTab('parcel')} className={`btn ${tab === 'parcel' ? 'btn-primary' : ''}`} style={{ flex: 1, justifyContent: 'center', background: tab === 'parcel' ? '#101828' : 'transparent', color: tab === 'parcel' ? 'white' : 'var(--text)', boxShadow: 'none', padding: '10px' }}>
                  <Package size={18} /> Parcel
                </button>
                <button onClick={() => setTab('grocery')} className={`btn ${tab === 'grocery' ? 'btn-primary' : ''}`} style={{ flex: 1, justifyContent: 'center', background: tab === 'grocery' ? '#101828' : 'transparent', color: tab === 'grocery' ? 'white' : 'var(--text)', boxShadow: 'none', padding: '10px' }}>
                  <ShoppingCart size={18} /> Grocery
                </button>
              </div>

              <h2>{tab === 'parcel' ? 'Send a Parcel' : 'Order Groceries'}</h2>
              <form onSubmit={handleSubmit}>
                {tab === 'parcel' ? (
                  <>
                    <div className="form-group"><label>Sender Name</label><input name="sender_name" className="form-input" placeholder="Your name" required /></div>
                    <div className="form-row">
                      <div className="form-group"><label>Pickup Address</label><input name="pickup_address" className="form-input" placeholder="Village / Landmark" required /></div>
                      <div className="form-group"><label>Delivery Address</label><input name="delivery_address" className="form-input" placeholder="Destination" required /></div>
                    </div>
                    <div className="form-row" style={{ marginTop: 12 }}>
                      <div className="form-group"><label>Parcel Type</label><select name="parcel_type" className="form-input"><option>Documents</option><option>Small Package (&lt;5kg)</option><option>Medium (5-20kg)</option><option>Large/Heavy (20kg+)</option><option>Food Items</option><option>Medicine</option></select></div>
                      <div className="form-group"><label>Phone</label><input name="phone" className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" required /></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group"><label>Your Name</label><input name="sender_name" className="form-input" placeholder="Full name" required /></div>
                    <div className="form-group"><label>Delivery Address</label><input name="delivery_address" className="form-input" placeholder="Village / House" required /></div>
                    <div className="form-group"><label>Grocery List</label><textarea name="grocery_list" className="form-input" placeholder="E.g. 2kg tomatoes, 1kg rice..." rows={4} style={{ resize: 'vertical' }} required /></div>
                    <div className="form-row" style={{ marginTop: 12 }}>
                      <div className="form-group"><label>Preferred Time</label><select name="preferred_time" className="form-input"><option>Morning (8am-12pm)</option><option>Afternoon (12-4pm)</option><option>Evening (4-8pm)</option><option>ASAP</option></select></div>
                      <div className="form-group"><label>Phone</label><input name="phone" className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" required /></div>
                    </div>
                  </>
                )}
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label>Preferred Date (Optional)</label>
                  <input name="preferred_date" className="form-input" type="date" />
                </div>
                
                <div style={{ margin: '20px 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-outline-accent btn-sm" onClick={captureRequestLocation}>{locationLoading ? 'Locating...' : 'Use Current Location'}</button>
                  {requestCoords && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{requestCoords.lat.toFixed(5)}, {requestCoords.lng.toFixed(5)}</span>}
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }} type="submit">
                  {tab === 'parcel' ? 'Schedule Pickup' : 'Place Order'} <ArrowRight size={18} />
                </button>
              </form>
            </div>

            <div className="split-form-image-wrap">
              <img src="/delivery_form_desi_1776344339989.png" alt="Delivery Service" />
              <div style={{ position: 'absolute', bottom: 40, left: 40, right: 40, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(15px)', padding: 30, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Fast Village Delivery</h3>
                <p style={{ fontSize: 16, opacity: 0.9 }}>Send anything from documents to groceries. Our local partners ensure safe and same-day delivery across village limits.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center', gap: 60 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>About Our <span style={{ color: 'var(--primary)' }}>Delivery Service</span></h2>
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
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: '100%', height: '100%', background: 'var(--primary)', opacity: 0.05, borderRadius: 32, zIndex: 0 }}></div>
              <img 
                src="/delivery_about_side.png" 
                alt="Delivery Service" 
                style={{ width: '100%', borderRadius: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative', zIndex: 1 }}
              />
              <div style={{ position: 'absolute', bottom: 20, left: -20, background: 'white', padding: '16px 24px', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={20} fill="white" /></div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>Top Rated Service</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Trusted by 10,000+ villagers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
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
