import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ marginBottom: 16, fontSize: 28 }}>
              <Navigation size={28} />
              GaonRide
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, maxWidth: 320 }}>
              Bridging the gap between villages and cities. Premium ride, delivery, and wedding services 
              for every village in India. Your village, our pride.
            </p>
            <div className="footer-social" style={{ marginTop: 20 }}>
              <a href="#"><Facebook size={18} /></a>
              <a href="#"><Instagram size={18} /></a>
              <a href="#"><Twitter size={18} /></a>
              <a href="#"><Youtube size={18} /></a>
            </div>
          </div>

          <div>
            <h4>Quick Links</h4>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/rides">Book a Ride</Link>
              <Link to="/deliveries">Deliveries</Link>
              <Link to="/events">Event Services</Link>
              <Link to="/partner">Become a Partner</Link>
              <Link to="/contact">Contact Us</Link>
            </div>
          </div>

          <div>
            <h4>Our Services</h4>
            <div className="footer-links">
              <a href="#">Auto Rickshaw Rides</a>
              <a href="#">Bolero / SUV Rides</a>
              <a href="#">Tractor Hire</a>
              <a href="#">Parcel Delivery</a>
              <a href="#">Grocery Delivery</a>
              <a href="#">Wedding Planning</a>
            </div>
          </div>

          <div>
            <h4>Contact Info</h4>
            <div className="footer-links">
              <a href="tel:+917301132018" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} /> +91 73011 32018
              </a>
              <a href="mailto:info@gaonride.com" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} /> info@gaonride.com
              </a>
              <a href="#" style={{ display: 'flex', alignItems: 'start', gap: 8 }}>
                <MapPin size={14} style={{ flexShrink: 0, marginTop: 4 }} />
                Village Bhawan, Gram Panchayat Road, India
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 GaonRide. All rights reserved. Built with ❤️ for every village.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="#" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Privacy Policy</a>
            <a href="#" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
