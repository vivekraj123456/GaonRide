import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, Phone, MapPin, Send, Facebook, Instagram, Twitter, Youtube, ChevronDown } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useLanguage } from '../components/LanguageContext';
import { supabase } from '../lib/supabase';

gsap.registerPlugin(ScrollTrigger);

const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    gsap.fromTo('.contact-hero-content', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 });
    
    document.querySelectorAll('.contact-card').forEach((card, i) => {
      gsap.fromTo(card, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.6, delay: i * 0.1,
        scrollTrigger: { trigger: card, start: 'top 85%' }
      });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = {
      full_name: formData.get('full_name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    try {
      const { error } = await supabase.from('contact_submissions').insert(data);
      if (error) throw error;
      showToast('Message sent! We\'ll get back to you soon.');
      form.reset();
    } catch (err) {
      showToast('Error sending message. Please try again.');
    }
  };

  const faqs = [
    { q: 'What are your operating hours?', a: 'Our delivery and ride services operate 24/7. Our support team is available from 8 AM to 10 PM daily.' },
    { q: 'How can I register as a driver?', a: 'Navigate to the "Partner" page and fill out the registration form. Our team will contact you for verification.' },
    { q: 'Do you provide services in my village?', a: 'We are rapidly expanding. Currently, we cover 500+ villages. Check the "Rides" page to see if your area is listed.' },
    { q: 'How do I cancel a booking?', a: 'You can cancel through the tracking link provided in your SMS or contact our support number immediately.' }
  ];

  return (
    <>
      <section className="hero" style={{ minHeight: '60vh', position: 'relative' }}>
        <div className="hero-bg"><img src="/village_contact_hero.png" alt="Contact Us" /></div>
        <div className="hero-overlay" />
        <div className="container">
          <div className="contact-hero-content hero-content" style={{ paddingTop: 140, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Get In Touch</p>
            <h1>Contact <span className="highlight">Support</span></h1>
            <p style={{ maxWidth: 600, margin: '0 auto' }}>Have questions or need help? Our local team is here to assist you 24/7. Reach out via form, phone, or visit our local hubs.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ position: 'relative', zIndex: 10, marginTop: -60 }}>
        <div className="container">
          <div className="grid-3">
            {[
              { icon: <Phone size={32} />, title: 'Call Us', info: '+91 98XXX XXXXX', sub: 'Mon-Sun, 8am-10pm' },
              { icon: <Mail size={32} />, title: 'Email Us', info: 'support@gaonride.com', sub: '24/7 Response' },
              { icon: <MapPin size={32} />, title: 'Visit Us', info: 'Village Hub, Town Area', sub: 'District Centre' }
            ].map((item, i) => (
              <div key={i} className="card-3d contact-card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ color: 'var(--accent-dark)', marginBottom: 20, display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{item.info}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="split-form-section">
        <div className="container">
          <div className="split-form-grid">
            <div className="split-form-content">
              <p style={{ color: 'var(--accent-dark)', fontWeight: 700, textTransform: 'uppercase', fontSize: 13, letterSpacing: 1.5, marginBottom: 16 }}>Connect With Us</p>
              <h2>How can we help you?</h2>
              <form onSubmit={handleSubmit}>
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
                  <label>Email</label>
                  <input name="email" className="form-input" type="email" placeholder="your@email.com" />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <select name="subject" className="form-input">
                    <option>General Inquiry</option>
                    <option>Ride Issue</option>
                    <option>Delivery Issue</option>
                    <option>Event Booking</option>
                    <option>Partnership</option>
                    <option>Driver Complaint</option>
                    <option>Suggestion</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea name="message" className="form-input" placeholder="Tell us how we can help..." rows={5} style={{ resize: 'vertical' }} required />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} type="submit">
                  Send Message <Send size={18} />
                </button>
              </form>
            </div>

            <div className="split-form-image-wrap">
              <img src="/contact_form_desi_1776344278618.png" alt="Support Team" />
              <div style={{ position: 'absolute', bottom: 40, left: 40, right: 40, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', padding: 30, borderRadius: 24, border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                <h4 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Speak with our local team</h4>
                <p style={{ fontSize: 16, opacity: 0.9 }}>Over 100,000+ villagers trust GaonRide for their daily needs. We are here to support you 24/7.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-2">
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Local Presence, <span style={{ color: 'var(--accent-dark)' }}>Global Standards</span></h2>
              <div style={{ padding: 32, background: 'white', borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-dark)', flexShrink: 0 }}>
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: 4 }}>Headquarters</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>123 Gaon Path, District Centre, State - 1100XX</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-dark)', flexShrink: 0 }}>
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: 4 }}>Toll-Free</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>1800-GAON-RIDE (4266-7433)</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Follow Us</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Stay connected with GaonRide on social media for updates, offers, and community stories.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {[{ icon: <Facebook size={20} />, color: '#1877f2' }, { icon: <Instagram size={20} />, color: '#e4405f' }, { icon: <Twitter size={20} />, color: '#1da1f2' }, { icon: <Youtube size={20} />, color: '#ff0000' }].map((s, i) => (
                  <a
                    key={i}
                    href="#"
                    style={{ width: 48, height: 48, borderRadius: 12, background: s.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>

              <div style={{ marginTop: 32, padding: 24, background: 'var(--accent-subtle)', borderRadius: 'var(--radius)', border: '1px solid rgba(22,51,0,0.1)' }}>
                <h4 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--accent-dark)' }}>Village Coordinators</h4>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>We have local coordinators in 200+ villages across UP, Bihar, MP, and Rajasthan. Ask about your village coordinator when you call!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-header"><h2>Contact <span>FAQ</span></h2></div>
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
    </>
  );
};

export default ContactPage;
