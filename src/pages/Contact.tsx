
import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { Phone, Mail, MapPin, MessageCircle, ChevronDown, Send, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';

const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    gsap.fromTo('.contact-hero', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        full_name: data.get('full_name') as string,
        phone: data.get('phone') as string,
        email: (data.get('email') as string) || null,
        subject: data.get('subject') as string,
        message: data.get('message') as string,
      });
      if (error) throw error;
      showToast("📩 Message sent! We'll respond within 24 hours.");
      form.reset();
    } catch (err) {
      showToast('❌ Error sending message. Please try again.');
      console.error(err);
    }
  };

  const contactInfo = [
    { icon: <Phone size={24} />, title: 'Call Us', info: '+91 73011 32018', sub: 'Mon-Sat, 8am-10pm IST', action: 'tel:+917301132018' },
    { icon: <MessageCircle size={24} />, title: 'WhatsApp', info: '+91 73011 32018', sub: 'Quick replies, 24/7', action: 'https://wa.me/917301132018' },
    { icon: <Mail size={24} />, title: 'Email Us', info: 'info@gaonride.com', sub: 'Response within 24 hrs', action: 'mailto:info@gaonride.com' },
    { icon: <MapPin size={24} />, title: 'Head Office', info: 'Village Bhawan, Gram Panchayat Road', sub: 'Lucknow, Uttar Pradesh 226001', action: '#' },
  ];

  const officeHours = [
    { day: 'Monday - Friday', hours: '8:00 AM - 8:00 PM' },
    { day: 'Saturday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Sunday', hours: '10:00 AM - 4:00 PM' },
    { day: 'Public Holidays', hours: '10:00 AM - 2:00 PM' },
  ];

  const faqs = [
    { q: 'How can I reach customer support?', a: 'You can call us at +91 73011 32018, WhatsApp us anytime, or fill the contact form above. Our average response time is under 30 minutes during working hours.' },
    { q: 'I have a complaint about a driver. How do I report it?', a: 'Please call our helpline or fill the form with subject "Driver Complaint". Include the ride date, time, and driver name if known. We take every complaint seriously and resolve within 48 hours.' },
    { q: 'Can I visit your office?', a: 'Yes! Our head office in Lucknow is open during office hours. We also have village coordinators across UP, Bihar, MP, and Rajasthan whom you can meet locally.' },
    { q: 'Do you operate in my village?', a: "We are expanding rapidly! Currently we cover 500+ villages across UP, Bihar, MP, and Rajasthan. Contact us with your village name and we'll let you know or prioritize expansion to your area." },
    { q: 'I want to suggest a new service. How can I share my idea?', a: 'We love hearing from our community! Fill the contact form with subject "Suggestion" and share your idea. Many of our best features came from village user feedback.' },
  ];

  return (
    <>
      <section className="hero" style={{ minHeight: '50vh', position: 'relative' }}>
        <div className="hero-bg"><img src="/village_contact_hero.png" alt="Community Support" /></div>
        <div className="hero-overlay" />
        <div className="container">
          <div className="contact-hero hero-content" style={{ paddingTop: 140 }}>
            <p style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>We're Here For You</p>
            <h1>Always <span className="highlight">Connected</span></h1>
            <p>Whether you need help booking a ride or want to bring GaonRide to your village, our community support team is just a call away.</p>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 5, pointerEvents: 'none' }}>
          <svg viewBox="0 0 1440 320" style={{ display: 'block', width: '100%', height: '80px' }} preserveAspectRatio="none">
            <path fill="#ffffff" fillOpacity="1" d="M0,192 C288,320 576,64 864,192 C1152,320 1344,128 1440,160 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </section>

      <section className="section" style={{ marginTop: -40, position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div className="grid-4">
            {contactInfo.map((c, i) => (
              <a href={c.action} key={i} className="card-3d" style={{ padding: 28, textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,77,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', margin: '0 auto 16px' }}>{c.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{c.title}</h3>
                <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{c.info}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.sub}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-10%', bottom: '0%', opacity: 0.03, zIndex: 0, pointerEvents: 'none' }}>
          <svg width="600" height="600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="var(--primary)" d="M49.2,-72.6C62.9,-63.3,72.6,-47.9,78.4,-31.1C84.2,-14.3,86.1,3.9,81.2,20.2C76.3,36.5,64.6,50.9,50.3,60.6C36,70.3,19.1,75.5,1.2,73.8C-16.7,72.1,-33.4,63.5,-47.5,52.3C-61.6,41.1,-73.1,27.3,-78.4,11.4C-83.7,-4.5,-82.8,-22.5,-74.6,-37C-66.4,-51.5,-50.9,-62.5,-35.5,-71.1C-20.1,-79.7,-4.8,-85.9,10.6,-88.7C26,-91.5,41.4,-82,49.2,-72.6Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid-2">
            <div className="form-card">
              <h3>Send us a Message</h3>
              <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
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
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} type="submit">Send Message <Send size={18} /></button>
              </form>
            </div>

            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Office <span style={{ color: 'var(--primary)' }}>Hours</span></h2>
              <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 32 }}>
                {officeHours.map((o, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px', borderBottom: i < officeHours.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <span style={{ fontWeight: 600 }}>{o.day}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{o.hours}</span>
                  </div>
                ))}
              </div>

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

              <div style={{ marginTop: 32, padding: 24, background: 'rgba(0,77,0,0.04)', borderRadius: 'var(--radius)', border: '1px solid rgba(0,77,0,0.1)' }}>
                <h4 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>Village Coordinators</h4>
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
