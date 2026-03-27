import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Tent, Music, ChefHat, Car, Calendar, ArrowRight, ChevronDown, Star } from 'lucide-react';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { addPendingConfirmation, requestBrowserNotificationPermission, useConfirmationNotifications } from '../hooks/useConfirmationNotifications';
import { serviceTent, serviceDj, serviceCatering, serviceCar } from '../assets/images';

gsap.registerPlugin(ScrollTrigger);

const EventsPage: React.FC = () => {
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState<number|null>(null);
  const [services, setServices] = useState({tent:true,dj:true,catering:false,car:false});

  useConfirmationNotifications({ table: 'event_quotes', label: 'Event', showToast });

  useEffect(() => {
    window.scrollTo(0,0);
    gsap.fromTo('.ev-hero',{opacity:0,y:30},{opacity:1,y:0,duration:0.8});
    document.querySelectorAll('.card-3d').forEach((c,i)=>{
      gsap.fromTo(c,{opacity:0,y:40},{opacity:1,y:0,duration:0.6,delay:i*0.15,scrollTrigger:{trigger:c,start:'top 85%'}});
    });
  },[]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const selectedServices = Object.entries(services).filter(([,v]) => v).map(([k]) => k);
    try {
      const { data, error } = await supabase.from('event_quotes').insert({
        full_name: data.get('full_name') as string,
        phone: data.get('phone') as string,
        event_type: data.get('event_type') as string,
        event_date: data.get('event_date') as string,
        expected_guests: data.get('expected_guests') as string,
        services: selectedServices,
        special_requests: data.get('special_requests') as string || null,
      }).select().single();
      if (error) throw error;
      if (data?.id) addPendingConfirmation('event_quotes', String(data.id));
      requestBrowserNotificationPermission();
      showToast('Event quote request submitted! We will notify you when it is confirmed.');
      form.reset();
      setServices({tent:false,dj:false,catering:false,car:false});
    } catch (err) {
      showToast('❌ Error submitting. Please try again.');
      console.error(err);
    }
  };

  const serviceCards = [
    {img:serviceTent,title:'Tent & Decoration',desc:'Beautiful shamiyana tents with flower decorations, stage setup, lighting, seating arrangements, and entrance gates for weddings and festivals.',price:'₹15,000+',icon:<Tent size={20}/>},
    {img:serviceDj,title:'DJ & Sound System',desc:'Professional DJ with high-quality speakers, mixing console, LED lights, and fog machines. Perfect for sangeet, mehendi, and reception nights.',price:'₹8,000+',icon:<Music size={20}/>},
    {img:serviceCatering,title:'Catering Service',desc:'Traditional village-style catering with authentic flavors. Veg and non-veg menus, chaat counters, sweet stalls, and live cooking stations.',price:'₹200/plate',icon:<ChefHat size={20}/>},
    {img:serviceCar,title:'Wedding Cars',desc:'Decorated Bolero SUVs and luxury cars for baraat processions. Flower garlands, ribbons, and a professional chauffeur included.',price:'₹5,000+',icon:<Car size={20}/>},
  ];

  const packages = [
    {name:'Basic',price:'₹25,000',sub:'Small gatherings',features:['Tent setup (up to 100 guests)','Basic decoration','Sound system rental','1 catering counter'],f:false},
    {name:'Premium',price:'₹75,000',sub:'Full wedding',features:['Grand tent (300+ guests)','Premium flower decor','DJ + Sound + Lights','Full catering (veg/non-veg)','Decorated wedding car','Event coordinator'],f:true},
    {name:'Royal',price:'₹1,50,000',sub:'Destination wedding',features:['Luxury tent with AC','Designer theme decor','Celebrity DJ','Multi-cuisine catering','Fleet of decorated cars','Photography & Video'],f:false},
  ];

  const faqs = [
    {q:'How early should I book for a wedding?',a:'We recommend booking at least 2-3 weeks in advance for best availability. For peak season (Nov-Feb), book 1-2 months early.'},
    {q:'Can I customize the catering menu?',a:'Absolutely! Our chefs will work with you to create a custom menu. We specialize in regional cuisines from UP, Bihar, MP, Rajasthan, and more.'},
    {q:'Do you provide photography services?',a:'Yes, with our Premium and Royal packages. We have a network of professional photographers and videographers experienced in village weddings.'},
    {q:'What if it rains during the event?',a:'Our tents are waterproof with proper drainage. We also carry backup tarps and can set up emergency coverings within 30 minutes.'},
    {q:'Can I book individual services?',a:'Yes! You can book tent, DJ, catering, or cars separately. Mix and match as per your needs and budget.'},
  ];

  return (
    <>
      <section className="hero" style={{minHeight:'60vh'}}>
        <div className="hero-bg"><img src={serviceTent} alt="Events"/></div>
        <div className="hero-overlay"/>
        <div className="container">
          <div className="ev-hero hero-content" style={{paddingTop:140}}>
            <p style={{color:'var(--accent)',fontWeight:600,letterSpacing:2,textTransform:'uppercase',marginBottom:12}}>🎉 Celebrate in Style</p>
            <h1>Event & <span className="highlight">Wedding</span> Services</h1>
            <p>From intimate village gatherings to grand weddings — tent, DJ, catering, and decorated cars, all in one place.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header"><h2>All Your <span>Event Needs</span> in One Place</h2><p>Choose from our wide range of premium event services.</p></div>
          <div className="grid-4">
            {serviceCards.map((s,i)=>(
              <div className="card-3d" key={i}>
                <div className="card-image"><img src={s.img} alt={s.title}/></div>
                <div className="card-body">
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                    <span style={{color:'var(--primary)'}}>{s.icon}</span>
                    <h3 style={{fontSize:18}}>{s.title}</h3>
                  </div>
                  <p>{s.desc}</p>
                  <div style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontWeight:800,color:'var(--primary)',fontSize:18}}>{s.price}</span>
                    <div className="card-tag"><Star size={12} fill="var(--accent)" color="var(--accent)"/> Popular</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="grid-2">
            <div>
              <h2 style={{fontSize:32,fontWeight:800,marginBottom:16}}>Get a <span style={{color:'var(--primary)'}}>Quote</span> for Your Event!</h2>
              <p style={{color:'var(--text-muted)',marginBottom:32}}>Tell us about your event and we'll prepare a detailed quote within 24 hours. No commitment required.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                {[
                  {n:'500+',l:'Events Completed'},
                  {n:'4.9★',l:'Average Rating'},
                  {n:'100+',l:'Village Partners'},
                  {n:'₹0',l:'Quote Fee'},
                ].map((s,i)=>(
                  <div key={i} style={{padding:20,background:'white',borderRadius:'var(--radius)',textAlign:'center',boxShadow:'var(--shadow)'}}>
                    <div style={{fontSize:28,fontWeight:900,color:'var(--primary)'}}>{s.n}</div>
                    <div style={{fontSize:13,color:'var(--text-muted)'}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-card" style={{boxShadow:'0 20px 60px rgba(0,0,0,0.12)'}}>
              <h3>📋 Request a Quote</h3>
              <form onSubmit={handleSubmit} style={{marginTop:20}}>
                <div className="form-row">
                  <div className="form-group"><label>Full Name</label><input name="full_name" className="form-input" placeholder="Your name" required/></div>
                  <div className="form-group"><label>Phone</label><input name="phone" className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" required/></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Event Type</label>
                    <select name="event_type" className="form-input"><option>Wedding</option><option>Engagement</option><option>Birthday</option><option>Anniversary</option><option>Festival / Fair</option><option>Religious Ceremony</option><option>Other</option></select>
                  </div>
                  <div className="form-group"><label>Event Date</label><input name="event_date" className="form-input" type="date" required/></div>
                </div>
                <div className="form-group">
                  <label>Expected Guests</label>
                  <select name="expected_guests" className="form-input"><option>Up to 50</option><option>50-100</option><option>100-300</option><option>300-500</option><option>500+</option></select>
                </div>
                <div className="form-group">
                  <label>Services Needed</label>
                  <div className="checkbox-group">
                    {Object.entries({tent:'Tent & Decoration',dj:'DJ & Sound',catering:'Catering',car:'Wedding Car'}).map(([k,v])=>(
                      <label className="checkbox-label" key={k}>
                        <input type="checkbox" checked={services[k as keyof typeof services]} onChange={e=>setServices({...services,[k]:e.target.checked})}/>
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group"><label>Special Requests</label><textarea name="special_requests" className="form-input" placeholder="Any specific requirements..." rows={3} style={{resize:'vertical'}}/></div>
                <button className="btn btn-accent btn-lg" style={{width:'100%'}} type="submit">Get Quote <ArrowRight size={18}/></button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header"><h2>Event <span>Packages</span></h2><p>Complete packages for every budget.</p></div>
          <div className="grid-3">
            {packages.map((p,i)=>(
              <div className={`price-card ${p.f?'featured':''}`} key={i}>
                <h3 style={{fontWeight:700,fontSize:20}}>{p.name}</h3>
                <div className="price-amount">{p.price}</div>
                <p style={{color:'var(--text-muted)',fontSize:14}}>{p.sub}</p>
                <ul className="price-features">{p.features.map(f=><li key={f}>✓ {f}</li>)}</ul>
                <button className="btn btn-primary" style={{width:'100%'}} onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>Get This Package</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container" style={{maxWidth:800}}>
          <div className="section-header"><h2>Event <span>FAQ</span></h2></div>
          {faqs.map((f,i)=>(
            <div className="faq-item" key={i}><button className="faq-question" onClick={()=>setOpenFaq(openFaq===i?null:i)}>{f.q}<ChevronDown size={20} style={{transform:openFaq===i?'rotate(180deg)':'rotate(0)',transition:'transform 0.3s'}}/></button>{openFaq===i&&<div className="faq-answer">{f.a}</div>}</div>
          ))}
        </div>
      </section>
    </>
  );
};
export default EventsPage;
