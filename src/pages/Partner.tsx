import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  Car,
  ChevronDown,
  Clock,
  IndianRupee,
  MapPin,
  Shield,
  Star,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';

gsap.registerPlugin(ScrollTrigger);

const PartnerPage: React.FC = () => {
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [counters, setCounters] = useState({ drivers: 0, earnings: 0, villages: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const [vehicleTypes, setVehicleTypes] = useState<Record<string, boolean>>({ auto: false, bolero: false, bike: false, tractor: false });
  const [serviceRoles, setServiceRoles] = useState<Record<string, boolean>>({ driver: true, parcel_boy: false, event_support: false });

  const [locPhone, setLocPhone] = useState('');
  const [locAvailability, setLocAvailability] = useState(true);
  const [locationBusy, setLocationBusy] = useState(false);
  const [autoTracking, setAutoTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const getErrorMessage = (err: unknown): string => {
    if (typeof err === 'object' && err !== null && 'message' in err) {
      const msg = (err as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim()) return msg;
    }
    return 'Unknown error';
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    gsap.fromTo('.partner-hero', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 });
    document.querySelectorAll('.card-3d').forEach((c, i) => {
      gsap.fromTo(c, { opacity: 0, y: 40 }, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: i * 0.12,
        scrollTrigger: { trigger: c, start: 'top 85%' },
      });
    });

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const targets = { drivers: 1200, earnings: 35000, villages: 500 };
        const duration = 2000;
        const start = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setCounters({
            drivers: Math.floor(targets.drivers * eased),
            earnings: Math.floor(targets.earnings * eased),
            villages: Math.floor(targets.villages * eased),
          });
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    const selectedVehicles = Object.entries(vehicleTypes).filter(([, value]) => value).map(([key]) => key);
    const selectedRoles = Object.entries(serviceRoles).filter(([, value]) => value).map(([key]) => key);

    try {
      const primaryPayload = {
        full_name: String(data.get('full_name') || ''),
        phone: String(data.get('phone') || ''),
        village: String(data.get('village') || ''),
        district: String(data.get('district') || ''),
        vehicle_types: selectedVehicles,
        partner_roles: selectedRoles.length ? selectedRoles : ['driver'],
        is_available: true,
        aadhaar: String(data.get('aadhaar') || '') || null,
      };
      const { error } = await supabase.from('partner_registrations').insert(primaryPayload);

      if (error) {
        const message = getErrorMessage(error).toLowerCase();
        const isSchemaMismatch =
          message.includes('partner_roles') ||
          message.includes('is_available') ||
          message.includes('available_after') ||
          message.includes('column');

        if (!isSchemaMismatch) throw error;

        // Backward-compatible fallback for older DB schema.
        const { error: fallbackError } = await supabase.from('partner_registrations').insert({
          full_name: primaryPayload.full_name,
          phone: primaryPayload.phone,
          village: primaryPayload.village,
          district: primaryPayload.district,
          vehicle_types: primaryPayload.vehicle_types,
          aadhaar: primaryPayload.aadhaar,
        });
        if (fallbackError) throw fallbackError;
        showToast('Registered successfully (basic mode). Ask admin to run latest DB schema for role-based dispatch.');
      } else {
        showToast('Partner registration submitted successfully.');
      }
      form.reset();
      setVehicleTypes({ auto: false, bolero: false, bike: false, tractor: false });
      setServiceRoles({ driver: true, parcel_boy: false, event_support: false });
    } catch (err) {
      console.error(err);
      showToast(`Error submitting registration: ${getErrorMessage(err)}`);
    }
  };

  const updateLiveLocation = async () => {
    if (!locPhone.trim()) {
      showToast('Enter registered phone number first.');
      return;
    }
    if (!navigator.geolocation) {
      showToast('Geolocation not supported in this browser.');
      return;
    }

    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data: partner, error: findErr } = await supabase
            .from('partner_registrations')
            .select('id')
            .eq('phone', locPhone.trim())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (findErr) throw findErr;
          if (!partner?.id) {
            showToast('No partner found for this phone.');
            setLocationBusy(false);
            return;
          }

          const nowIso = new Date().toISOString();
          const { error: locErr } = await supabase.from('partner_live_locations').upsert({
            partner_id: partner.id,
            latitude: coords.latitude,
            longitude: coords.longitude,
            updated_at: nowIso,
          });
          if (locErr) throw locErr;

          const { error: updateErr } = await supabase
            .from('partner_registrations')
            .update({ is_available: locAvailability, available_after: nowIso })
            .eq('id', partner.id);

          if (updateErr) throw updateErr;
          showToast('Live location updated.');
        } catch (error) {
          console.error(error);
          showToast(`Could not update live location: ${getErrorMessage(error)}`);
        } finally {
          setLocationBusy(false);
        }
      },
      () => {
        showToast('Location permission denied.');
        setLocationBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const startAutoTracking = async () => {
    if (!locPhone.trim()) {
      showToast('Enter registered phone number first.');
      return;
    }
    if (!navigator.geolocation) {
      showToast('Geolocation not supported in this browser.');
      return;
    }
    if (watchId !== null) return;

    const id = navigator.geolocation.watchPosition(
      async ({ coords }) => {
        try {
          const { data: partner, error: findErr } = await supabase
            .from('partner_registrations')
            .select('id')
            .eq('phone', locPhone.trim())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (findErr || !partner?.id) return;
          const nowIso = new Date().toISOString();
          await supabase.from('partner_live_locations').upsert({
            partner_id: partner.id,
            latitude: coords.latitude,
            longitude: coords.longitude,
            updated_at: nowIso,
          });
          await supabase
            .from('partner_registrations')
            .update({ is_available: locAvailability, available_after: nowIso })
            .eq('id', partner.id);
        } catch (err) {
          console.error(err);
        }
      },
      () => showToast('Auto tracking stopped: location permission denied.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );

    setWatchId(id);
    setAutoTracking(true);
    showToast('Live auto-tracking started.');
  };

  const stopAutoTracking = () => {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
    setWatchId(null);
    setAutoTracking(false);
    showToast('Live auto-tracking stopped.');
  };

  useEffect(() => {
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const benefits = [
    { icon: <IndianRupee size={28} />, title: 'Earn Rs 800-1500/day', desc: 'Flexible earnings based on your availability and ride volume.' },
    { icon: <Clock size={28} />, title: 'Work on Your Schedule', desc: 'No mandatory shift. Choose your own working hours.' },
    { icon: <Shield size={28} />, title: 'Insurance Coverage', desc: 'Accident support and safer partner operations.' },
    { icon: <Star size={28} />, title: 'Weekly Incentives', desc: 'Performance bonuses for active and reliable partners.' },
    { icon: <Users size={28} />, title: 'Training & Support', desc: 'Onboarding help and field support from local coordinators.' },
    { icon: <TrendingUp size={28} />, title: 'Grow Your Business', desc: 'Build stable income and grow with repeat customers.' },
  ];

  const faqs = [
    { q: 'What documents are needed?', a: 'Aadhaar, driving license, and vehicle RC if you are driving.' },
    { q: 'Can I choose multiple services?', a: 'Yes. You can select roles like Driver + Parcel + Event Support.' },
    { q: 'How do I mark myself online?', a: 'Use the location update section to share your current location and availability.' },
  ];

  return (
    <>
      <section className="hero" style={{ minHeight: '60vh', position: 'relative' }}>
        <div className="hero-bg"><img src="/village_partner_hero.png" alt="Partner" /></div>
        <div className="hero-overlay" />
        <div className="container">
          <div className="partner-hero hero-content" style={{ paddingTop: 140, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Drive and Earn</p>
            <h1>Become a <span className="highlight">GaonRide</span> Partner</h1>
            <p style={{ maxWidth: 600, margin: '0 auto' }}>Register as multi-service partner and receive nearby assignments.</p>
          </div>
        </div>
      </section>

      <section className="section section-dark" ref={statsRef}>
        <div className="container">
          <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <div className="stat-card"><div className="stat-number">{counters.drivers.toLocaleString()}+</div><div className="stat-label">Active Partners</div></div>
            <div className="stat-card"><div className="stat-number">Rs {counters.earnings.toLocaleString()}</div><div className="stat-label">Avg Monthly Earning</div></div>
            <div className="stat-card"><div className="stat-number">{counters.villages}+</div><div className="stat-label">Villages Covered</div></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header"><h2>Why <span>Partner</span> With Us?</h2></div>
          <div className="grid-3">
            {benefits.map((benefit) => (
              <div className="card-3d" key={benefit.title} style={{ padding: 28 }}>
                <div style={{ color: 'var(--primary)', marginBottom: 16 }}>{benefit.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{benefit.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="split-form-section">
        <div className="container">
          <div className="split-form-grid">
            <div className="split-form-content">
              <p style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: 13, letterSpacing: 1.5, marginBottom: 16 }}>Register Now</p>
              <h2>Join as Partner</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group"><label>Full Name</label><input name="full_name" className="form-input" placeholder="Your name" required /></div>
                  <div className="form-group"><label>Phone</label><input name="phone" className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" required /></div>
                </div>
                <div className="form-row" style={{ marginTop: 12 }}>
                  <div className="form-group"><label>Village / Town</label><input name="village" className="form-input" placeholder="Village" required /></div>
                  <div className="form-group"><label>District</label><input name="district" className="form-input" placeholder="District" required /></div>
                </div>
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label>Vehicle Type</label>
                  <div className="checkbox-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {Object.entries({ auto: 'Auto Rickshaw', bolero: 'Bolero / SUV', bike: 'Bike', tractor: 'Tractor / Pickup' }).map(([key, value]) => (
                      <label className="checkbox-label" key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                        <input type="checkbox" checked={vehicleTypes[key]} onChange={(e) => setVehicleTypes({ ...vehicleTypes, [key]: e.target.checked })} /> {value}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label>Service Roles (select multiple)</label>
                  <div className="checkbox-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {Object.entries({ driver: 'Driver', parcel_boy: 'Parcel Delivery', event_support: 'Event Support' }).map(([key, value]) => (
                      <label className="checkbox-label" key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                        <input type="checkbox" checked={serviceRoles[key]} onChange={(e) => setServiceRoles({ ...serviceRoles, [key]: e.target.checked })} /> {value}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label>Aadhaar Number</label>
                  <input name="aadhaar" className="form-input" placeholder="XXXX XXXX XXXX" />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 24 }} type="submit">
                  Join GaonRide <UserPlus size={18} />
                </button>
              </form>
            </div>

            <div className="split-form-image-wrap">
              <img src="/partner_form_desi_1776344308735.png" alt="Partner Program" />
              <div style={{ position: 'absolute', bottom: 40, left: 40, right: 40, background: 'rgba(0,100,0,0.3)', backdropFilter: 'blur(20px)', padding: 30, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Grow with our community</h3>
                <p style={{ fontSize: 16, opacity: 0.9 }}>Connect with 1200+ partners who are earning more and and building a better future with GaonRide.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', padding: 40, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Partner Live Location</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Update this from your phone to receive nearest assignments.</p>
            <div className="form-group">
              <label>Registered Phone</label>
              <input className="form-input" style={{ background: '#fcfcfc', border: '1px solid #eaecf0', borderRadius: 8, padding: '12px 16px', width: '100%' }} value={locPhone} onChange={(e) => setLocPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </div>
            <label className="checkbox-label" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              <input type="checkbox" checked={locAvailability} onChange={(e) => setLocAvailability(e.target.checked)} /> I am available for new jobs
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={updateLiveLocation} disabled={locationBusy} style={{ padding: '12px 24px' }}>
                <MapPin size={16} /> {locationBusy ? 'Updating...' : 'Share Current Location'}
              </button>
              {!autoTracking ? (
                <button className="btn btn-primary" style={{ background: '#f3f4f6', color: '#101828' }} onClick={startAutoTracking}>Start Real-Time Tracking</button>
              ) : (
                <button className="btn btn-outline" style={{ color: '#dc2626', borderColor: '#fecaca' }} onClick={stopAutoTracking}>Stop Tracking</button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-header"><h2>Partner <span>FAQ</span></h2></div>
          {faqs.map((f, i) => (
            <div className="faq-item" key={f.q}>
              <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.q}
                <ChevronDown size={20} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
              </button>
              {openFaq === i && <div className="faq-answer">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default PartnerPage;
