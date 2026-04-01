import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { UserPlus, IndianRupee, Clock, Shield, Star, ArrowRight, ChevronDown, Users, Car, MapPin, TrendingUp } from 'lucide-react';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';

gsap.registerPlugin(ScrollTrigger);

const PartnerPage: React.FC = () => {
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState<number|null>(null);
  const [counters, setCounters] = useState({drivers:0,earnings:0,villages:0});
  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    window.scrollTo(0,0);
    gsap.fromTo('.partner-hero',{opacity:0,y:30},{opacity:1,y:0,duration:0.8});
    document.querySelectorAll('.card-3d').forEach((c,i)=>{
      gsap.fromTo(c,{opacity:0,y:40},{opacity:1,y:0,duration:0.6,delay:i*0.12,scrollTrigger:{trigger:c,start:'top 85%'}});
    });

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const targets = {drivers:1200,earnings:35000,villages:500};
        const dur = 2000, start = Date.now();
        const tick = () => {
          const p = Math.min((Date.now()-start)/dur,1);
          const e = 1-Math.pow(1-p,3);
          setCounters({drivers:Math.floor(targets.drivers*e),earnings:Math.floor(targets.earnings*e),villages:Math.floor(targets.villages*e)});
          if(p<1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    },{threshold:0.3});
    if(statsRef.current) observer.observe(statsRef.current);
    return ()=>observer.disconnect();
  },[]);

  const [vehicleTypes, setVehicleTypes] = useState<Record<string,boolean>>({auto:false,bolero:false,bike:false,tractor:false});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const selected = Object.entries(vehicleTypes).filter(([,v]) => v).map(([k]) => k);
    try {
      const { error } = await supabase.from('partner_registrations').insert({
        full_name: data.get('full_name') as string,
        phone: data.get('phone') as string,
        village: data.get('village') as string,
        district: data.get('district') as string,
        vehicle_types: selected,
        aadhaar: data.get('aadhaar') as string || null,
      });
      if (error) throw error;
      showToast('🎉 Partner registration submitted! Welcome to GaonRide!');
      form.reset();
      setVehicleTypes({auto:false,bolero:false,bike:false,tractor:false});
    } catch (err) {
      showToast('❌ Error submitting. Please try again.');
      console.error(err);
    }
  };

  const benefits = [
    {icon:<IndianRupee size={28}/>,title:'Earn ₹800-1500/day',desc:'Flexible earnings based on your availability. Drive as much or as little as you want. Top drivers earn ₹35,000+ monthly.'},
    {icon:<Clock size={28}/>,title:'Work on Your Schedule',desc:'No mandatory hours. Drive during school runs, market hours, or festivals. You choose when to work and when to rest.'},
    {icon:<Shield size={28}/>,title:'Insurance Coverage',desc:'Free accident insurance cover for all active drivers. We also cover vehicle repairs up to ₹10,000 per month for registered partners.'},
    {icon:<Star size={28}/>,title:'Weekly Incentives',desc:'Complete 50 rides/week and earn ₹2,000 bonus. Weekend surge pricing gives you 1.5x earnings on Saturdays and Sundays.'},
    {icon:<Users size={28}/>,title:'Training & Support',desc:'Free driving and customer service training. Our village coordinators are always available for support and conflict resolution.'},
    {icon:<TrendingUp size={28}/>,title:'Grow Your Business',desc:'Start with 1 vehicle and grow. Many partners now manage fleets of 3-5 vehicles, earning ₹1 Lakh+ monthly from their village.'},
  ];

  const earnings = [
    {vehicle:'Auto Rickshaw',daily:'₹600-1000',monthly:'₹18-30K',trips:'12-20/day'},
    {vehicle:'Bolero / SUV',daily:'₹800-1500',monthly:'₹24-45K',trips:'6-12/day'},
    {vehicle:'Bike Taxi',daily:'₹400-800',monthly:'₹12-24K',trips:'15-25/day'},
    {vehicle:'Tractor / Pickup',daily:'₹1000-2000',monthly:'₹30-60K',trips:'3-8/day'},
  ];

  const faqs = [
    {q:'What documents do I need to register?',a:'Aadhaar card, driving license, vehicle RC (registration certificate), and a passport-size photo. That\'s all!'},
    {q:'Is there a registration fee?',a:'Absolutely not! Registration is completely free. We only take a small 10% commission on completed rides.'},
    {q:'Can I use my own vehicle?',a:'Yes! You must own or have a valid rental agreement for the vehicle. We accept autos, Boleros, bikes, tractors, and pickups.'},
    {q:'How do I receive payments?',a:'Daily settlements via UPI or bank transfer. You can also choose weekly settlements if preferred.'},
    {q:'What if my vehicle breaks down?',a:'Contact our support team. We\'ll either repair it at a partner garage (subsidized rates) or assign your customers to nearby drivers temporarily.'},
  ];

  return (
    <>
      <section className="hero" style={{minHeight:'60vh', position: 'relative'}}>
        <div className="hero-bg"><img src="/village_partner_hero.png" alt="Partner"/></div>
        <div className="hero-overlay"/>
        <div className="container">
          <div className="partner-hero hero-content" style={{paddingTop:140}}>
            <p style={{color:'var(--accent)',fontWeight:600,letterSpacing:2,textTransform:'uppercase',marginBottom:12}}>💼 Drive & Earn</p>
            <h1>Become a <span className="highlight">GaonRide</span> Partner</h1>
            <p>Own a vehicle? Join 1,200+ happy driver partners earning steady daily income without leaving their village.</p>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 1, pointerEvents: 'none' }}>
          <svg viewBox="0 0 1440 320" style={{ display: 'block', width: '100%', height: '120px' }} preserveAspectRatio="none">
            <path fill="rgba(255,255,255,0.03)" d="M0,288 L480,224 L960,160 L1440,64 L1440,320 L0,320 Z"></path>
            <path fill="rgba(255,255,255,0.07)" d="M0,320 L480,256 L960,192 L1440,128 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </section>

      <section className="section section-dark" ref={statsRef}>
        <div className="container">
          <div className="stats-row" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
            <div className="stat-card"><div className="stat-number">{counters.drivers.toLocaleString()}+</div><div className="stat-label">Active Partners</div></div>
            <div className="stat-card"><div className="stat-number">₹{counters.earnings.toLocaleString()}</div><div className="stat-label">Avg Monthly Earning</div></div>
            <div className="stat-card"><div className="stat-number">{counters.villages}+</div><div className="stat-label">Villages Covered</div></div>
          </div>
        </div>
      </section>

      <section className="section" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '-5%', top: '10%', opacity: 0.03, zIndex: 0, pointerEvents: 'none' }}>
          <svg width="500" height="500" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="var(--primary)" d="M51.2,-70.1C65.5,-61.7,75.6,-46.2,80.5,-29.4C85.4,-12.6,85,5.5,78.8,21.5C72.6,37.5,60.6,51.4,46.1,60.8C31.6,70.2,14.6,75.1,-2.3,78.3C-19.2,81.5,-36.1,83,-49.6,74.9C-63.1,66.8,-73.2,49.1,-79.1,30.5C-85,11.9,-86.7,-8.6,-80.1,-25.5C-73.5,-42.4,-58.6,-55.7,-42.9,-63.8C-27.2,-71.9,-10.7,-75.8,5.7,-83.1C22.1,-90.4,42.5,-84.9,51.2,-70.1Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header"><h2>Why <span>Partner</span> With Us?</h2><p>Real benefits for real village entrepreneurs.</p></div>
          <div className="grid-3">
            {benefits.map((b,i)=>(
              <div className="card-3d" key={i} style={{padding:28}}>
                <div style={{color:'var(--primary)',marginBottom:16}}>{b.icon}</div>
                <h3 style={{fontSize:18,fontWeight:700,marginBottom:8}}>{b.title}</h3>
                <p style={{color:'var(--text-muted)',fontSize:14}}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-header"><h2>Earning <span>Potential</span></h2><p>See how much you can earn by vehicle type.</p></div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',background:'white',borderRadius:'var(--radius-lg)',overflow:'hidden',boxShadow:'var(--shadow)'}}>
              <thead><tr style={{background:'var(--primary)',color:'white'}}>
                <th style={{padding:'16px 24px',textAlign:'left'}}>Vehicle</th>
                <th style={{padding:'16px 24px',textAlign:'left'}}>Daily Earning</th>
                <th style={{padding:'16px 24px',textAlign:'left'}}>Monthly Earning</th>
                <th style={{padding:'16px 24px',textAlign:'left'}}>Avg Trips/Day</th>
              </tr></thead>
              <tbody>{earnings.map((e,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}>
                  <td style={{padding:'14px 24px',fontWeight:600}}>{e.vehicle}</td>
                  <td style={{padding:'14px 24px',color:'var(--primary)',fontWeight:700}}>{e.daily}</td>
                  <td style={{padding:'14px 24px',color:'var(--primary)',fontWeight:700}}>{e.monthly}</td>
                  <td style={{padding:'14px 24px'}}>{e.trips}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-2">
            <div>
              <h2 style={{fontSize:32,fontWeight:800,marginBottom:16}}>Register & <span style={{color:'var(--primary)'}}>Start Earning</span></h2>
              <p style={{color:'var(--text-muted)',marginBottom:28}}>Quick 3-step process. Register today and start accepting rides by tomorrow!</p>
              <div className="steps-grid" style={{gridTemplateColumns:'1fr',gap:20}}>
                {['Submit the form with your details','Our team verifies your documents (24 hrs)','Get approved & start earning!'].map((s,i)=>(
                  <div key={i} style={{display:'flex',gap:16,alignItems:'center'}}>
                    <div className="step-num" style={{width:44,height:44,fontSize:16,flexShrink:0,margin:0}}>{i+1}</div>
                    <p style={{fontWeight:500}}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-card" style={{boxShadow:'0 20px 60px rgba(0,0,0,0.12)'}}>
              <h3>🤝 Join Now</h3>
              <form onSubmit={handleSubmit} style={{marginTop:20}}>
                <div className="form-row"><div className="form-group"><label>Full Name</label><input name="full_name" className="form-input" placeholder="Your name" required/></div><div className="form-group"><label>Phone</label><input name="phone" className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" required/></div></div>
                <div className="form-row"><div className="form-group"><label>Village / Town</label><input name="village" className="form-input" placeholder="Your village name" required/></div><div className="form-group"><label>District</label><input name="district" className="form-input" placeholder="District name" required/></div></div>
                <div className="form-group"><label>Vehicle Type</label>
                  <div className="checkbox-group">
                    {Object.entries({auto:'Auto Rickshaw',bolero:'Bolero / SUV',bike:'Bike',tractor:'Tractor / Pickup'}).map(([k,v])=>
                      <label className="checkbox-label" key={k}><input type="checkbox" checked={vehicleTypes[k]} onChange={e=>setVehicleTypes({...vehicleTypes,[k]:e.target.checked})}/> {v}</label>
                    )}
                  </div>
                </div>
                <div className="form-group"><label>Aadhaar Number</label><input name="aadhaar" className="form-input" placeholder="XXXX XXXX XXXX"/></div>
                <button className="btn btn-accent btn-lg" style={{width:'100%'}} type="submit">Join GaonRide <UserPlus size={18}/></button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container" style={{maxWidth:800}}>
          <div className="section-header"><h2>Partner <span>FAQ</span></h2></div>
          {faqs.map((f,i)=>(
            <div className="faq-item" key={i}><button className="faq-question" onClick={()=>setOpenFaq(openFaq===i?null:i)}>{f.q}<ChevronDown size={20} style={{transform:openFaq===i?'rotate(180deg)':'rotate(0)',transition:'transform 0.3s'}}/></button>{openFaq===i&&<div className="faq-answer">{f.a}</div>}</div>
          ))}
        </div>
      </section>
    </>
  );
};
export default PartnerPage;
