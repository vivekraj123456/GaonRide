import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Tent, Music, ChefHat, Car, Calendar, ArrowRight, ChevronDown, Star, ShoppingCart, Trash2 } from 'lucide-react';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { addPendingConfirmation, requestBrowserNotificationPermission, useConfirmationNotifications } from '../hooks/useConfirmationNotifications';

gsap.registerPlugin(ScrollTrigger);

const SERVICE_CATALOG: Record<string, { id: string, name: string, price: number, unit: string }[]> = {
  tent: [
    { id: 'std_tent', name: 'Standard Shamiyana', price: 5000, unit: 'per unit' },
    { id: 'prem_tent', name: 'Premium Decorative Tent', price: 12000, unit: 'per unit' },
    { id: 'lighting', name: 'Decorative Lighting', price: 2000, unit: 'set' },
    { id: 'seating', name: 'Chair & Sofa Set (100 guests)', price: 3000, unit: 'per 100' },
    { id: 'stage', name: 'Grand Stage Setup', price: 8000, unit: 'unit' },
  ],
  dj: [
    { id: 'basic_sound', name: 'Basic Sound System', price: 4000, unit: 'day' },
    { id: 'full_dj', name: 'Full DJ Setup (incl. Console)', price: 10000, unit: 'night' },
    { id: 'led_lights', name: 'LED Par & Moving Heads', price: 3000, unit: 'set' },
    { id: 'fog', name: 'Fog/Smoke Machine', price: 1500, unit: 'unit' },
  ],
  catering: [
    { id: 'veg_plate', name: 'Standard Veg Plate', price: 250, unit: 'per plate' },
    { id: 'nonveg_plate', name: 'Premium Non-Veg Plate', price: 450, unit: 'per plate' },
    { id: 'sweet_stall', name: 'Live Sweet Stall', price: 5000, unit: 'unit' },
    { id: 'chaat', name: 'Chaat & Snacks Counter', price: 4000, unit: 'unit' },
  ],
  car: [
    { id: 'bolero', name: 'Decorated Bolero', price: 4000, unit: 'day' },
    { id: 'scorpio', name: 'Decorated Scorpio/SUV', price: 6000, unit: 'day' },
    { id: 'luxury', name: 'Luxury Wedding Sedan', price: 12000, unit: 'day' },
  ]
};

const EventsPage: React.FC = () => {
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [services, setServices] = useState({ tent: true, dj: false, catering: false, car: false });
  const [selectedItems, setSelectedItems] = useState<Record<string, Record<string, number>>>({});
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [venueCoords, setVenueCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useConfirmationNotifications({ table: 'event_quotes', label: 'Event', showToast });

  useEffect(() => {
    window.scrollTo(0, 0);
    gsap.fromTo('.ev-hero', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 });
    document.querySelectorAll('.card-3d').forEach((c, i) => {
      gsap.fromTo(c, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, delay: i * 0.15, scrollTrigger: { trigger: c, start: 'top 85%' } });
    });
  }, []);

  const updateItemQuantity = (serviceId: string, itemId: string, delta: number) => {
    setSelectedItems(prev => {
      const newSelected = { ...prev };
      const serviceItems = { ...(newSelected[serviceId] || {}) };
      const currentQty = serviceItems[itemId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      if (newQty === 0) {
        delete serviceItems[itemId];
      } else {
        serviceItems[itemId] = newQty;
      }

      if (Object.keys(serviceItems).length === 0) {
        delete newSelected[serviceId];
      } else {
        newSelected[serviceId] = serviceItems;
      }

      // Automatically select the service if items are added
      if (newQty > 0) {
        setServices(s => ({ ...s, [serviceId]: true }));
      }

      return newSelected;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueCoords) {
      showToast('Location sharing is mandatory. Tap "Use Current Location" first.');
      return;
    }
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const selectedServices = Object.entries(services).filter(([, v]) => v).map(([k]) => k);
    
    // Format detailed items for database
    const cartEntries = Object.entries(selectedItems).flatMap(([sId, items]) => 
      Object.entries(items).map(([itemId, qty]) => {
        const itemInfo = SERVICE_CATALOG[sId]?.find(i => i.id === itemId);
        return { name: itemInfo?.name, qty, price: (itemInfo?.price || 0) * qty };
      })
    );

    const totalEstimated = cartEntries.reduce((acc, item) => acc + item.price, 0);
    const detailedList = cartEntries.map(item => `${item.name} (${item.qty}x) - ₹${item.price}`).join('\n');

    try {
      const { data, error } = await supabase.from('event_quotes').insert({
        full_name: formData.get('full_name') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        event_type: formData.get('event_type') as string,
        event_date: formData.get('event_date') as string,
        expected_guests: formData.get('expected_guests') as string,
        venue_lat: venueCoords?.lat ?? null,
        venue_lng: venueCoords?.lng ?? null,
        services: selectedServices,
        special_requests: cartEntries.length > 0 
          ? `ITEMIZED ORDER:\n${detailedList}\n\nTOTAL ESTIMATED: ₹${totalEstimated}\n\nUSER NOTE: ${formData.get('special_requests') || 'None'}`
          : formData.get('special_requests') as string,
      }).select().single();
      
      if (error) throw error;
      if (data?.id) addPendingConfirmation('event_quotes', String(data.id));
      requestBrowserNotificationPermission();
      showToast('Event quote request submitted! We will notify you when it is confirmed.');
      form.reset();
      setServices({ tent: false, dj: false, catering: false, car: false });
      setSelectedItems({});
    } catch (err) {
      showToast('❌ Error submitting. Please try again.');
      console.error(err);
    }
  };

  const captureVenueLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported in this browser.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setVenueCoords({ lat: coords.latitude, lng: coords.longitude });
      setLocationLoading(false);
      showToast('Event location captured.');
    }, () => {
      setLocationLoading(false);
      showToast('Could not capture location.');
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const serviceCards = [
    { id: 'tent', img: '/village_tent.png', title: 'Tent & Decoration', desc: 'Beautiful shamiyana tents with flower decorations, stage setup, lighting, seating arrangements, and entrance gates for weddings and festivals.', price: '₹15,000+', icon: <Tent size={20} /> },
    { id: 'dj', img: '/village_dj.png', title: 'DJ & Sound System', desc: 'Professional DJ with high-quality speakers, mixing console, LED lights, and fog machines. Perfect for sangeet, mehendi, and reception nights.', price: '₹8,000+', icon: <Music size={20} /> },
    { id: 'catering', img: '/village_catering.png', title: 'Catering Service', desc: 'Traditional village-style catering with authentic flavors. Veg and non-veg menus, chaat counters, sweet stalls, and live cooking stations.', price: '₹200/plate', icon: <ChefHat size={20} /> },
    { id: 'car', img: '/village_car.png', title: 'Wedding Cars', desc: 'Decorated Bolero SUVs and luxury cars for baraat processions. Flower garlands, ribbons, and a professional chauffeur included.', price: '₹5,000+', icon: <Car size={20} /> },
  ];

  const packages = [
    { name: 'Basic', price: '₹25,000', sub: 'Small gatherings', features: ['Tent setup (up to 100 guests)', 'Basic decoration', 'Sound system rental', '1 catering counter'], f: false },
    { name: 'Premium', price: '₹75,000', sub: 'Full wedding', features: ['Grand tent (300+ guests)', 'Premium flower decor', 'DJ + Sound + Lights', 'Full catering (veg/non-veg)', 'Decorated wedding car', 'Event coordinator'], f: true },
    { name: 'Royal', price: '₹1,50,000', sub: 'Destination wedding', features: ['Luxury tent with AC', 'Designer theme decor', 'Celebrity DJ', 'Multi-cuisine catering', 'Fleet of decorated cars', 'Photography & Video'], f: false },
  ];

  const faqs = [
    { q: 'How early should I book for a wedding?', a: 'We recommend booking at least 2-3 weeks in advance for best availability. For peak season (Nov-Feb), book 1-2 months early.' },
    { q: 'Can I customize the catering menu?', a: 'Absolutely! Our chefs will work with you to create a custom menu. We specialize in regional cuisines from UP, Bihar, MP, Rajasthan, and more.' },
    { q: 'Do you provide photography services?', a: 'Yes, with our Premium and Royal packages. We have a network of professional photographers and videographers experienced in village weddings.' },
    { q: 'What if it rains during the event?', a: 'Our tents are waterproof with proper drainage. We also carry backup tarps and can set up emergency coverings within 30 minutes.' },
    { q: 'Can I book individual services?', a: 'Yes! You can book tent, DJ, catering, or cars separately. Mix and match as per your needs and budget.' },
  ];

  return (
    <>
      <section className="hero" style={{ minHeight: '60vh', position: 'relative' }}>
        <div className="hero-bg"><img src="/event.png" alt="Events" /></div>
        <div className="hero-overlay" />
        <div className="container">
          <div className="ev-hero hero-content" style={{ paddingTop: 140, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>🎉 Celebrate in Style</p>
            <h1>Event & <span className="highlight">Wedding</span> Services</h1>
            <p style={{ maxWidth: 600, margin: '0 auto' }}>From intimate village gatherings to grand weddings — tent, DJ, catering, and decorated cars, all in one place.</p>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 5, pointerEvents: 'none' }}>
          <svg viewBox="0 0 1440 320" style={{ display: 'block', width: '100%', height: '90px' }} preserveAspectRatio="none">
            <path fill="#ffffff" fillOpacity="1" d="M0,128 Q720,350 1440,128 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header"><h2>All Your <span>Event Needs</span> in One Place</h2><p>Choose from our wide range of premium event services.</p></div>
          <div className="grid-4">
            {serviceCards.map((s, i) => {
              const selectedCount = Object.keys(selectedItems[s.id] || {}).length;
              return (
                <div className={`card-3d ${activeModal === s.id ? 'active' : ''}`} key={i} onClick={() => setActiveModal(s.id)}>
                  <div className="card-image"><img src={s.img} alt={s.title} /></div>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ color: 'var(--accent-dark)' }}>{s.icon}</span>
                      <h3 style={{ fontSize: 18 }}>{s.title}</h3>
                    </div>
                    <p>{s.desc}</p>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: 'var(--accent-dark)', fontSize: 18 }}>{s.price}</span>
                      {selectedCount > 0 ? (
                        <div className="card-tag" style={{ background: 'var(--accent)', color: 'var(--accent-dark)' }}>{selectedCount} Selected</div>
                      ) : (
                        <div className="card-tag"><Star size={12} fill="var(--accent)" color="var(--accent)" /> Premium</div>
                      )}
                    </div>
                    <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }}>Customize & Add</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CUSTOMIZATION MODAL */}
        {activeModal && (
          <div className="modal-overlay" onClick={() => setActiveModal(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Customize {serviceCards.find(s => s.id === activeModal)?.title}</h3>
                <button className="close-btn" onClick={() => setActiveModal(null)}>&times;</button>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>Select the items you need for your event and we'll include them in your quote.</p>
                <div className="item-list">
                  {SERVICE_CATALOG[activeModal].map(item => (
                    <div className="catalog-item" key={item.id}>
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-price">₹{item.price} <small>/ {item.unit}</small></span>
                      </div>
                      <div className="item-actions">
                        <button className="qty-btn" onClick={() => updateItemQuantity(activeModal, item.id, -1)}>-</button>
                        <span className="qty-value">{selectedItems[activeModal]?.[item.id] || 0}</span>
                        <button className="qty-btn" onClick={() => updateItemQuantity(activeModal, item.id, 1)}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { 
                  setActiveModal(null);
                  showToast('Items added to selection cart! Click the cart icon to review.');
                }}>Confirm Selection</button>
              </div>
            </div>
          </div>
        )}

        {/* CART MODAL */}
        {isCartOpen && (
          <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
            <div className="modal-content cart-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3><ShoppingCart size={20} /> Your Selection Cart</h3>
                <button className="close-btn" onClick={() => setIsCartOpen(false)}>&times;</button>
              </div>
              <div className="modal-body">
                {Object.keys(selectedItems).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <ShoppingCart size={48} style={{ color: '#e5e7eb', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>Your cart is empty. Personalize services to add items!</p>
                  </div>
                ) : (
                  <div className="cart-items">
                    {Object.entries(selectedItems).map(([sId, items]) => (
                      <div key={sId} className="cart-service-group">
                        <h4 className="cart-service-title">{serviceCards.find(s => s.id === sId)?.title}</h4>
                        {Object.entries(items).map(([itemId, qty]) => {
                          const item = SERVICE_CATALOG[sId].find(i => i.id === itemId);
                          if (!item) return null;
                          return (
                            <div className="cart-item" key={itemId}>
                              <div className="item-details">
                                <span className="item-name">{item.name}</span>
                                <span className="item-price">₹{item.price * qty} <small>(₹{item.price} x {qty})</small></span>
                              </div>
                              <div className="item-actions">
                                <button className="qty-btn" onClick={() => updateItemQuantity(sId, itemId, -1)}>-</button>
                                <span className="qty-value">{qty}</span>
                                <button className="qty-btn" onClick={() => updateItemQuantity(sId, itemId, 1)}>+</button>
                                <button className="delete-btn" onClick={() => updateItemQuantity(sId, itemId, -qty)}><Trash2 size={14} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <div className="cart-total">
                  <span>Estimated Total:</span>
                  <span className="total-amount">
                    ₹{Object.entries(selectedItems).reduce((acc, [sId, items]) => 
                      acc + Object.entries(items).reduce((sAcc, [itemId, qty]) => 
                        sAcc + (SERVICE_CATALOG[sId].find(i => i.id === itemId)?.price || 0) * qty
                      , 0)
                    , 0)}
                  </span>
                </div>
                <div className="cart-checkout-form" style={{ marginTop: 24, padding: 20, background: '#f8f9fa', borderRadius: 12 }}>
                  <h4 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Customer Details</h4>
                  <form id="cart-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input name="full_name" className="form-input" placeholder="Your name" required />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <input name="phone" className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <input name="address" className="form-input" placeholder="Delivery/Event address" required />
                    </div>
                    <div style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-outline-accent btn-sm" onClick={captureVenueLocation}>
                        {locationLoading ? 'Locating...' : 'Use Current Location'}
                      </button>
                      {venueCoords && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{venueCoords.lat.toFixed(5)}, {venueCoords.lng.toFixed(5)}</span>}
                    </div>
                    {!venueCoords && <p style={{ marginBottom: 12, fontSize: 12, color: '#b45309' }}>Location sharing is mandatory for nearest partner assignment.</p>}
                    <div className="form-group">
                      <label>Message (Optional)</label>
                      <textarea name="special_requests" className="form-input" placeholder="Any specific requirements..." rows={2} />
                    </div>
                    <input type="hidden" name="event_type" value="Custom Selection" />
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} type="submit">
                      Submit Quote Request
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING CART BUTTON */}
        {Object.keys(selectedItems).length > 0 && (
          <button className="floating-cart-btn" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={24} />
            <span className="cart-badge">
              {Object.values(selectedItems).reduce((acc, items) => acc + Object.keys(items).length, 0)}
            </span>
          </button>
        )}
      </section>

      <section id="quote-form" className="split-form-section">
        <div className="container">
          <div className="split-form-grid">
            <div className="split-form-content" style={{ order: 1 }}>
              <p style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>📋 Hassle-Free Planning</p>
              <h2>Get a <span className="highlight">Quote</span> for Your Event</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 16 }}>Tell us about your event and we'll prepare a detailed quote within 24 hours. No commitment required.</p>
              
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input name="full_name" className="form-input" placeholder="Your name" required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input name="phone" className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Event Type</label>
                    <select name="event_type" className="form-input">
                      <option>Wedding</option>
                      <option>Engagement</option>
                      <option>Birthday</option>
                      <option>Anniversary</option>
                      <option>Festival / Fair</option>
                      <option>Religious Ceremony</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Event Date</label>
                    <input name="event_date" className="form-input" type="date" required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Expected Guests</label>
                  <select name="expected_guests" className="form-input">
                    <option>Up to 50</option>
                    <option>50-100</option>
                    <option>100-300</option>
                    <option>300-500</option>
                    <option>500+</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Services Needed</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 8 }}>
                    {Object.entries({ tent: 'Tent & Decoration', dj: 'DJ & Sound', catering: 'Catering', car: 'Wedding Car' }).map(([k, v]) => (
                      <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: services[k as keyof typeof services] ? 'var(--accent-subtle)' : '#f9fafb', borderRadius: 10, border: services[k as keyof typeof services] ? '1px solid var(--accent)' : '1px solid #eaecf0', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <input type="checkbox" checked={services[k as keyof typeof services]} onChange={e => setServices({ ...services, [k]: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Event Location Address</label>
                  <input name="address" className="form-input" placeholder="Village / Landmark / House Name" required />
                </div>

                <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-outline-accent btn-sm" onClick={captureVenueLocation}>
                    {locationLoading ? 'Locating...' : '📍 Use Current Location'}
                  </button>
                  {venueCoords && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>GPS Position Captured ✓</span>}
                </div>

                {!venueCoords && <p style={{ marginBottom: 16, fontSize: 12, color: '#b45309', padding: '8px 12px', background: '#fffbeb', borderRadius: 6 }}>⚠️ Location sharing is mandatory for nearest partner assignment.</p>}

                <div className="form-group">
                  <label>Special Requests (Optional)</label>
                  <textarea name="special_requests" className="form-input" placeholder="Any specific requirements (e.g. Pure Veg, Specific Themes)..." rows={3} style={{ resize: 'vertical' }} />
                </div>

                <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} type="submit">
                  Generate Quote Request <ArrowRight size={18} />
                </button>
              </form>
            </div>

            <div className="split-form-image-wrap" style={{ order: 2 }}>
              <img 
                src="/event_form_desi.png" 
                alt="Celebrate with GaonRide" 
              />
              <div style={{ position: 'absolute', bottom: 40, left: 40, right: 40, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(15px)', padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                <h4 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Your Dream Event, Our Responsibility.</h4>
                <p style={{ fontSize: 15, opacity: 0.9 }}>From intimate village gatherings to grand weddings — we handle the essentials so you can focus on the memories.</p>
                <div style={{ marginTop: 24, display: 'flex', gap: 24 }}>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>500+</p>
                    <p style={{ fontSize: 12, opacity: 0.8 }}>Events Success</p>
                  </div>
                  <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }}></div>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>4.9★</p>
                    <p style={{ fontSize: 12, opacity: 0.8 }}>Avg. User Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header"><h2>Event <span>Packages</span></h2><p>Complete packages for every budget.</p></div>
          <div className="grid-3">
            {packages.map((p, i) => (
              <div className={`price-card ${p.f ? 'featured' : ''}`} key={i}>
                <h3 style={{ fontWeight: 700, fontSize: 20 }}>{p.name}</h3>
                <div className="price-amount">{p.price}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{p.sub}</p>
                <ul className="price-features">{p.features.map(f => <li key={f}>✓ {f}</li>)}</ul>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Get This Package</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-header"><h2>Event <span>FAQ</span></h2></div>
          {faqs.map((f, i) => (
            <div className="faq-item" key={i}><button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>{f.q}<ChevronDown size={20} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} /></button>{openFaq === i && <div className="faq-answer">{f.a}</div>}</div>
          ))}
        </div>
      </section>
    </>
  );
};
export default EventsPage;
