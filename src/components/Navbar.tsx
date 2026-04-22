import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navigation, Menu, X, Languages } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/rides', label: t('nav.rides') },
    { to: '/deliveries', label: t('nav.deliveries') },
    { to: '/events', label: t('nav.events') },
    { to: '/partner', label: t('nav.partner') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const toggleLang = () => setLang(lang === 'en' ? 'hi' : 'en');

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav">
          <Link to="/" className="logo">
            <Navigation size={30} />
            GaonRide
          </Link>

          <nav className="nav-links">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={location.pathname === l.to ? 'active' : ''}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="nav-right">
            <button className="lang-toggle" onClick={toggleLang} title="Switch language">
              <Languages size={16} />
              {lang === 'en' ? 'हिं' : 'EN'}
            </button>
            <Link to="/rides" className="btn btn-accent btn-sm">{t('nav.bookNow')}</Link>
            <button className="mobile-toggle" onClick={() => setMenuOpen(true)}>
              <Menu size={28} />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <button
          className="mobile-toggle"
          onClick={() => setMenuOpen(false)}
          style={{ position: 'absolute', top: 24, right: 24 }}
        >
          <X size={32} />
        </button>
        {links.map(l => (
          <Link key={l.to} to={l.to}>{l.label}</Link>
        ))}
        <button className="lang-toggle" onClick={toggleLang} style={{ marginTop: 16 }}>
          <Languages size={18} />
          {lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
        </button>
      </div>
    </>
  );
};

export default Navbar;
