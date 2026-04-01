import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Car, Package, Music, Tent, Star, Users, MapPin, Clock,
  Shield, Heart, ChevronRight, ArrowRight, Truck, CalendarHeart, Phone, Flame, Navigation
} from 'lucide-react';
import { ParticlesBg, Tilt3D } from '../components/Effects3D';

gsap.registerPlugin(ScrollTrigger);

const HomePage: React.FC = () => {
  const [counters, setCounters] = useState({ rides: 0, villages: 0, drivers: 0, events: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    // GSAP animations
    gsap.fromTo('.hero-content', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, delay: 0.3 });

    // Animate cards on scroll
    const cards = document.querySelectorAll('.card-3d');
    cards.forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 60, rotateX: 10 },
        {
          opacity: 1, y: 0, rotateX: 0,
          duration: 0.8, delay: i * 0.15,
          scrollTrigger: { trigger: card, start: 'top 85%' }
        }
      );
    });

    // Animate testimonials
    const testimonials = document.querySelectorAll('.testimonial-card');
    testimonials.forEach((t, i) => {
      gsap.fromTo(t,
        { opacity: 0, x: i % 2 === 0 ? -40 : 40 },
        {
          opacity: 1, x: 0, duration: 0.7,
          scrollTrigger: { trigger: t, start: 'top 85%' }
        }
      );
    });

    // Counter animation
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        animateCounters();
      }
    }, { threshold: 0.3 });

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const animateCounters = () => {
    const targets = { rides: 25000, villages: 500, drivers: 1200, events: 3000 };
    const duration = 2000;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setCounters({
        rides: Math.floor(targets.rides * ease),
        villages: Math.floor(targets.villages * ease),
        drivers: Math.floor(targets.drivers * ease),
        events: Math.floor(targets.events * ease),
      });

      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  return (
    <>
      {/* HERO */}
      <section className="hero" style={{ position: 'relative' }}>
        <div className="hero-bg">
          <img 
            src="/village1.jpg" 
            alt="GaonRide Village Transport" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
        <div className="hero-overlay" />
        <ParticlesBg />
        <div className="container">
          <div className="hero-content">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 16, marginBottom: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
                Empowering Rural India
              </p>
              <h1>
                Your Village, <br />
                <span className="highlight">Connected</span> to the World
              </h1>
              <p>
                From reliable daily rides and quick parcel deliveries to complete wedding planning — GaonRide brings top-tier services directly to your doorstep.
              </p>
              <div className="hero-cta">
                <Link to="/rides" className="btn btn-accent btn-lg">
                  Book a Ride <ArrowRight size={18} />
                </Link>
                <Link to="/events" className="btn btn-outline btn-lg">
                  Plan an Event
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="quick-actions"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link to="/rides" className="quick-action">
                <Car size={28} />
                <span>Book a Ride</span>
              </Link>
              <Link to="/rides" className="quick-action">
                <Truck size={28} />
                <span>Tractor Hire</span>
              </Link>
              <Link to="/deliveries" className="quick-action">
                <Package size={28} />
                <span>Parcel Delivery</span>
              </Link>
              <Link to="/events" className="quick-action">
                <CalendarHeart size={28} />
                <span>Wedding Services</span>
              </Link>
            </motion.div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 1, pointerEvents: 'none' }}>
          <svg viewBox="0 0 1440 320" style={{ display: 'block', width: '100%', height: '120px' }} preserveAspectRatio="none">
            <path fill="rgba(255,255,255,0.02)" d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,229.3C1248,235,1344,213,1392,202.7L1440,192L1440,320L0,320Z"></path>
            <path fill="rgba(255,255,255,0.04)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,165.3C960,192,1056,224,1152,213.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L0,320Z"></path>
            <path fill="rgba(255,255,255,0.08)" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,218.7C672,213,768,171,864,160C960,149,1056,171,1152,186.7C1248,203,1344,213,1392,218.7L1440,224L1440,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* STATS */}
      <section className="section section-dark" ref={statsRef}>
        <div className="container">
          <div className="section-header">
            <h2>Trusted by <span>Thousands</span> Across Rural India</h2>
            <p>We are committed to making transportation and services accessible in every corner of India.</p>
          </div>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-number">{counters.rides.toLocaleString()}+</div>
              <div className="stat-label">Rides Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{counters.villages}+</div>
              <div className="stat-label">Villages Served</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{counters.drivers.toLocaleString()}+</div>
              <div className="stat-label">Active Drivers</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{counters.events.toLocaleString()}+</div>
              <div className="stat-label">Events Managed</div>
            </div>
          </div>
        </div>
      </section>

      {/* EMERGENCY SOS */}
      <section className="emergency-strip">
        <div className="container">
          <div className="emergency-inner">
            <div className="emergency-header">
              <Shield color="#e53e3e" size={24} />
              <h3>Emergency Contacts</h3>
            </div>
            <div className="emergency-buttons">
              <a href="tel:108" className="emergency-btn">
                <div className="emergency-icon-box"><Phone size={24} /></div>
                <div className="emergency-info">
                  <span className="emergency-name">Ambulance</span>
                  <span className="emergency-number">108</span>
                </div>
              </a>
              <a href="tel:100" className="emergency-btn">
                <div className="emergency-icon-box"><Shield size={24} /></div>
                <div className="emergency-info">
                  <span className="emergency-name">Police</span>
                  <span className="emergency-number">100</span>
                </div>
              </a>
              <a href="tel:101" className="emergency-btn">
                <div className="emergency-icon-box"><Flame size={24} /></div>
                <div className="emergency-info">
                  <span className="emergency-name">Fire Brigade</span>
                  <span className="emergency-number">101</span>
                </div>
              </a>
              <a href="tel:+917301132018" className="emergency-btn">
                <div className="emergency-icon-box"><Navigation size={24} /></div>
                <div className="emergency-info">
                  <span className="emergency-name">GaonRide Help</span>
                  <span className="emergency-number">Support</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>How <span>GaonRide</span> Works</h2>
            <p>Getting a ride or planning an event in your village has never been easier.</p>
          </div>
          <div className="steps-grid">
            {[
              { num: '1', title: 'Choose Service', desc: 'Select from rides, deliveries, or event planning based on what you need.' },
              { num: '2', title: 'Enter Details', desc: 'Provide pickup, drop location, or event details through our easy form.' },
              { num: '3', title: 'Get Matched', desc: 'We instantly match you with the nearest available driver or service provider.' },
              { num: '4', title: 'Enjoy the Ride', desc: 'Sit back and relax! Your ride arrives or your event gets planned seamlessly.' },
            ].map(s => (
              <div className="step-card" key={s.num}>
                <div className="step-num">{s.num}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2>Our <span>Premium</span> Services</h2>
            <p>From daily commutes to grand weddings, we've got your village covered.</p>
          </div>
          <div className="grid-4">
            {[
              { img: '/service_rides.png', title: 'Village Rides', desc: 'Auto, Bolero, SUV — comfortable rides connecting villages to towns and cities.', link: '/rides', tag: 'Most Popular' },
              { img: '/service_delivery.png', title: 'Parcel & Grocery', desc: 'Send parcels or get fresh groceries delivered right to your village doorstep.', link: '/deliveries', tag: 'Fast Delivery' },
              { img: '/service_events.png', title: 'Event Planning', desc: 'Tent, decor, DJ, catering — complete wedding and event solutions in one place.', link: '/events', tag: 'Full Service' },
              { img: '/service_partner.png', title: 'Earn with Us', desc: 'Own a vehicle? Join GaonRide as a partner driver and earn daily income.', link: '/partner', tag: 'Join Now' },
            ].map((s, i) => (
              <Link to={s.link} key={i} style={{ textDecoration: 'none' }}>
                <div className="card-3d">
                  <div className="card-image">
                    <img src={s.img} alt={s.title} />
                  </div>
                  <div className="card-body">
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                    <div className="card-tag">
                      <ChevronRight size={14} />
                      {s.tag}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="section" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -100, left: -100, opacity: 0.03, zIndex: 0, pointerEvents: 'none', transform: 'scale(1.5)' }}>
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="400" height="400">
            <path fill="var(--primary)" d="M42.7,-73.4C55.9,-67.8,67.6,-56.3,74.9,-42.6C82.2,-28.9,85.1,-13,83.1,2.1C81.1,17.2,74.2,31.5,64.2,43.3C54.2,55.1,41.1,64.4,26.7,70.5C12.3,76.6,-3.4,79.5,-18.2,76C-33,72.5,-46.9,62.6,-58.3,50.3C-69.7,38,-78.6,23.3,-81.9,7.4C-85.2,-8.5,-82.9,-25.6,-74.3,-39.8C-65.7,-54,-50.8,-65.3,-36,-70.6C-21.2,-75.9,-6.5,-75.2,7.3,-84.3C21,-93.4,30,-99.8,42.7,-73.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header">
            <h2>Why Villages <span>Love</span> GaonRide</h2>
            <p>We understand rural India like no one else.</p>
          </div>
          <div className="grid-3">
            {[
              { icon: <Shield size={32} />, title: 'Safe & Reliable', desc: 'All drivers are verified with Aadhaar and background checks. Your safety is our top priority, especially for women and elderly travellers.' },
              { icon: <Clock size={32} />, title: 'Always On Time', desc: 'Our drivers know every village lane. GPS tracking ensures real-time visibility and on-time arrivals, rain or shine.' },
              { icon: <Heart size={32} />, title: 'Affordable Prices', desc: 'Transparent pricing with no hidden charges. We believe quality transport should be accessible to every villager.' },
              { icon: <MapPin size={32} />, title: 'Remote Coverage', desc: 'We go where others don\'t. From the smallest hamlet to the quietest village road — GaonRide reaches everywhere.' },
              { icon: <Star size={32} />, title: '4.8★ Rated', desc: 'Consistently rated among the best village transport services. Our community of happy customers speaks for itself.' },
              { icon: <Users size={32} />, title: 'Community First', desc: 'We employ local drivers and support local businesses. Every ride with GaonRide strengthens the village economy.' },
            ].map((f, i) => (
              <Tilt3D className="card-3d" key={i} style={{ padding: 32 }}>
                <div style={{ color: 'var(--primary)', marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{f.desc}</p>
              </Tilt3D>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2>What Our <span>Riders</span> Say</h2>
            <p>Real stories from real villagers across India.</p>
          </div>
          <div className="grid-3">
            {[
              { name: 'Ramesh Kumar', village: 'Chandauli, UP', text: 'GaonRide changed my daily commute! I used to wait hours for a bus. Now I book an auto in 2 minutes. The drivers are polite and the prices are fair.' },
              { name: 'Sunita Devi', village: 'Bhopal Rural, MP', text: 'I booked my daughter\'s wedding tent, DJ, and catering all through GaonRide. Everything was perfect and the prices were much lower than city rates.' },
              { name: 'Ajay Singh', village: 'Patna Rural, Bihar', text: 'As a driver partner, I earn ₹800-1200 daily. GaonRide gave me a steady income without leaving my village. My family is proud of me.' },
            ].map((t, i) => (
              <div className="testimonial-card" key={i}>
                <div className="quote-icon">"</div>
                <p>{t.text}</p>
                <div className="testimonial-author">
                  <div className="avatar">{t.name[0]}</div>
                  <div className="info">
                    <h4>{t.name}</h4>
                    <span>{t.village}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section-dark" style={{ textAlign: 'center' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, marginBottom: 16 }}>
              Ready to <span style={{ color: 'var(--accent)' }}>Experience</span> GaonRide?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, maxWidth: 500, margin: '0 auto 40px' }}>
              Join thousands of happy villagers who trust GaonRide for their daily transport and event needs.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/rides" className="btn btn-accent btn-lg">Book Your First Ride</Link>
              <Link to="/partner" className="btn btn-outline btn-lg">Become a Partner</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
