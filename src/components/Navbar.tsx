import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navigation, Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/rides', label: 'Rides' },
    { to: '/deliveries', label: 'Deliveries' },
    { to: '/events', label: 'Events' },
    { to: '/partner', label: 'Become a Partner' },
    { to: '/contact', label: 'Contact' },
  ];

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
            <Link to="/rides" className="btn btn-primary btn-sm">Book Now</Link>
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
      </div>
    </>
  );
};

export default Navbar;
