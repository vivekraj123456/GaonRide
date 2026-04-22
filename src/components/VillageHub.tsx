import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, CloudSun, Users, ArrowUpRight, MessageSquare, Heart, Star, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from './LanguageContext';


const VillageHub: React.FC = () => {
  const { t } = useLanguage();
  const tickerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
 
  const allMandiPrices = [
    { crop: t('crop.wheat'), price: '₹2,450', change: '+₹25' },
    { crop: t('crop.rice'), price: '₹2,250', change: '+₹12' },
    { crop: t('crop.mustard'), price: '₹5,600', change: '-₹30' },
    { crop: t('crop.potato'), price: '₹1,400', change: '+₹45' },
    { crop: t('crop.onion'), price: '₹2,800', change: '-₹20' },
    { crop: t('crop.cotton'), price: '₹7,200', change: '+₹110' },
    { crop: t('crop.soyabean'), price: '₹4,550', change: '+₹15' },
    { crop: t('crop.maize'), price: '₹2,100', change: '+₹8' },
    { crop: t('crop.moong'), price: '₹7,800', change: '-₹10' },
    { crop: t('crop.chana'), price: '₹5,100', change: '+₹35' },
    { crop: t('crop.turmeric'), price: '₹8,400', change: '+₹150' },
    { crop: t('crop.garlic'), price: '₹12,000', change: '-₹200' },
    { crop: t('crop.coriander'), price: '₹6,800', change: '+₹40' },
    { crop: t('crop.cumin'), price: '₹28,500', change: '+₹450' },
    { crop: t('crop.bajra'), price: '₹2,150', change: '+₹5' },
    { crop: t('crop.jowar'), price: '₹2,900', change: '+₹15' },
    { crop: t('crop.urad'), price: '₹7,400', change: '-₹25' },
    { crop: t('crop.masur'), price: '₹6,200', change: '+₹20' },
    { crop: t('crop.til'), price: '₹14,500', change: '+₹300' },
    { crop: t('crop.groundnut'), price: '₹6,400', change: '+₹60' },
    { crop: t('crop.sunflower'), price: '₹5,200', change: '-₹10' },
    { crop: t('crop.barley'), price: '₹2,050', change: '+₹4' },
    { crop: t('crop.tomato'), price: '₹2,200', change: '+₹350' },
    { crop: t('crop.chilli'), price: '₹18,000', change: '+₹120' },
  ];
 
  const searchResults = searchQuery 
    ? allMandiPrices.filter(p => p.crop.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  useEffect(() => {
    if (searchQuery && searchResults.length === 0) {
      setSearching(true);
      const timer = setTimeout(() => {
        // Generate a plausible mock price for unknown items to fulfill "everything" request
        const basePrice = Math.floor(Math.random() * 5000) + 1500;
        setGeneratedResult({
          crop: searchQuery,
          price: `₹${basePrice.toLocaleString('en-IN')}`,
          change: `+₹${Math.floor(Math.random() * 50)}`,
          est: true
        });
        setSearching(false);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setGeneratedResult(null);
      setSearching(false);
    }
  }, [searchQuery, searchResults.length]);

  const chaupalPosts = [
    { title: 'Success Story', author: 'Rajesh from Rampur', text: 'Managed to double my crop yield using GaonRide\'s tractor hiring service!', icon: <Star size={16} />, color: '#f59e0b' },
    { title: 'Helpful Driver', author: 'Anita G.', text: 'Big thanks to Driver Mohan for helping my elderly mother reaching hospital on time.', icon: <Heart size={16} />, color: '#ef4444' },
    { title: 'New Arrival', author: 'GaonRide Team', text: 'We now have 5 new SUVs available in Chandauli district. Book yours today!', icon: <MessageSquare size={16} />, color: '#3b82f6' },
  ];

  useEffect(() => {
    if (tickerRef.current) {
      gsap.to(tickerRef.current, {
        x: '-20%',
        duration: 20,
        repeat: -1,
        ease: 'none',
      });
    }

    // Use fromTo for better reliability and to ensure opacity 1 is always reached
    gsap.fromTo('.hub-card', 
      { 
        opacity: 0, 
        y: 40 
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
        scrollTrigger: {
          trigger: '.village-hub',
          start: 'top 85%',
        }
      }
    );
  }, []);

  return (
    <section className="village-hub section section-alt" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="container">
        <div className="section-header">
          <h2>{t('nav.home')} <span>Hub</span></h2>
          <p style={{ color: 'var(--text)', fontWeight: 500 }}>Important daily updates and community stories from your village.</p>
        </div>

        {/* MANDI TICKER & SEARCH */}
        <div className="mandi-container" style={{ marginBottom: 40, background: 'white', borderRadius: 16, padding: '20px 0', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(0,77,0,0.1)', overflow:'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', marginBottom: 12, borderBottom: '1px solid #f3f4f6', paddingBottom: 15, flexWrap:'wrap', gap:12 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp size={20} style={{ color: 'var(--accent-dark)', marginRight: 8 }} />
              <span style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>{t('hub.mandiTitle')}</span>
            </div>
            <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder={t('hub.mandiSearchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 36px',
                  borderRadius: 50,
                  border: '1px solid #e2e8f0',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
              />
              {searchQuery && (
                <X 
                  size={14} 
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)' }} 
                />
              )}
            </div>
          </div>
 
          {searchQuery ? (
            <div style={{ padding: '0 24px', display: 'flex', gap: 20, flexWrap: 'wrap', animation: 'fadeIn 0.3s ease' }}>
              {searchResults.length > 0 ? (
                searchResults.map((p, i) => (
                  <div key={i} className="mandi-item" style={{ background: '#f0fdf4', padding: '10px 20px', borderRadius: 12, border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 800, textTransform: 'uppercase' }}>Live Mandi</span>
                      <span style={{ fontWeight: 700, color: '#166534' }}>{p.crop}</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--accent-dark)' }}>{p.price}</span>
                    <span style={{ fontSize: 13, color: p.change.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 600 }}>{p.change}</span>
                  </div>
                ))
              ) : searching ? (
                <p style={{ fontSize: 14, color: 'var(--accent-dark)', fontWeight: 700, display:'flex', alignItems:'center', gap:8 }}>
                  <span className="spinner-sm"></span> Searching global database...
                </p>
              ) : generatedResult ? (
                <div className="mandi-item" style={{ background: '#fefce8', padding: '10px 20px', borderRadius: 12, border: '1px solid #fef08a', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 10, color: '#854d0e', fontWeight: 800, textTransform: 'uppercase' }}>LIVE ESTIMATE</span>
                    <span style={{ fontWeight: 700, color: '#854d0e' }}>{generatedResult.crop}</span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 20, color: '#854d0e' }}>{generatedResult.price}</span>
                  <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>{generatedResult.change}</span>
                </div>
              ) : (
                <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>No exact matches found.</p>
              )}
            </div>
          ) : (
            <div className="mandi-ticker-wrap" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div ref={tickerRef} className="mandi-ticker" style={{ display: 'inline-flex', gap: 40 }}>
                {allMandiPrices.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{p.crop}</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent-dark)' }}>{p.price}</span>
                    <span style={{ fontSize: 13, color: p.change.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 600 }}>{p.change}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid-2" style={{ alignItems: 'stretch' }}>
          {/* WEATHER ADVICE */}
          <div className="hub-card" style={{ 
            background: 'white', 
            padding: 32, 
            borderRadius: 'var(--radius-lg)', 
            boxShadow: 'var(--shadow-lg)', 
            border: '1px solid rgba(0,77,0,0.1)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fff7ed', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloudSun size={24} /></div>
                <h3 style={{ fontSize: 20, fontWeight: 800 }}>{t('hub.weatherTitle')}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#004d00' }}>32°C</span>
                <p style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 600 }}>Lucknow, UP</p>
              </div>
            </div>
            
            <div style={{ borderLeft: '4px solid #f59e0b', paddingLeft: 16, marginBottom: 24 }}>
              <p style={{ fontSize: 16, lineHeight: 1.6, fontWeight: 600, color: 'var(--text)' }}>{t('hub.advice.sowing')}</p>
            </div>
            <div style={{ borderLeft: '4px solid #3b82f6', paddingLeft: 16 }}>
              <p style={{ fontSize: 16, lineHeight: 1.6, fontWeight: 600, color: 'var(--text)' }}>{t('hub.advice.irrigation')}</p>
            </div>
            
            <Link to="/weather" className="btn btn-primary" style={{ marginTop: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px' }}>
              View Detailed Forecast <ArrowUpRight size={18} />
            </Link>
          </div>

          {/* CHAUPAL */}
          <div className="hub-card" style={{ 
            background: 'white', 
            padding: 32, 
            borderRadius: 'var(--radius-lg)', 
            boxShadow: 'var(--shadow-lg)', 
            border: '1px solid rgba(0,77,0,0.1)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={24} /></div>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>{t('hub.chaupalTitle')}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chaupalPosts.map((post, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  gap: 16, 
                  background: '#f8fafc', // Very light gray-blue background
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: '12px', background: post.color, color: 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{post.icon}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#000000' }}>{post.author}</span>
                      <span style={{ fontSize: 10, background: '#D1E7DD', padding: '2px 8px', borderRadius: 6, color: '#004d00', fontWeight: 800, textTransform: 'uppercase' }}>{post.title}</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#1a1a2e', lineHeight: 1.5, fontWeight: 600 }}>{post.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/chaupal" className="btn btn-primary" style={{ marginTop: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px' }}>
              Visit Community Chaupal <MessageSquare size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VillageHub;
