import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Package, ShoppingCart, Clock, MapPin, Shield, ChevronDown, Truck, Box, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { addPendingConfirmation, requestBrowserNotificationPermission, useConfirmationNotifications } from '../hooks/useConfirmationNotifications';
import { serviceCatering } from '../assets/images';
gsap.registerPlugin(ScrollTrigger);

const DeliveriesPage: React.FC = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'parcel'|'grocery'>('parcel');
  const [openFaq, setOpenFaq] = useState<number|null>(null);

  useConfirmationNotifications({ table: 'delivery_orders', label: 'Delivery', showToast });

  useEffect(() => { window.scrollTo(0,0); gsap.fromTo('.del-hero',{opacity:0,y:30},{opacity:1,y:0,duration:0.8}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    try {
      const { data, error } = await supabase.from('delivery_orders').insert({
        type: tab,
        sender_name: data.get('sender_name') as string || null,
        pickup_address: data.get('pickup_address') as string || null,
        delivery_address: data.get('delivery_address') as string || '',
        parcel_type: data.get('parcel_type') as string || null,
        grocery_list: data.get('grocery_list') as string || null,
        preferred_time: data.get('preferred_time') as string || null,
        phone: data.get('phone') as string || '',
      }).select().single();
      if (error) throw error;
      if (data?.id) addPendingConfirmation('delivery_orders', String(data.id));
      requestBrowserNotificationPermission();
      showToast(tab==='parcel' ? 'Parcel pickup scheduled! We will notify you when it is confirmed.' : 'Grocery order placed! We will notify you when it is confirmed.');
      form.reset();
    } catch (err) {
      showToast('❌ Error submitting. Please try again.');
      console.error(err);
    }
  };

  const faqs = [
    {q:'How fast can you deliver?',a:'Within village: 30-60 min. Village to town: 2-4 hours. Longer distances: next day.'},
    {q:'What items can I send?',a:'Documents, clothes, electronics, food, medicines and more. No hazardous items.'},
    {q:'How do I track my delivery?',a:'You receive an SMS with tracking link after booking.'},
    {q:'What groceries are available?',a:'Fresh vegetables, fruits, rice, dal, oil, spices, and daily essentials from local mandis.'},
    {q:'Is there a minimum order?',a:'No minimum order! We deliver any amount.'},
  ];

  return (
    <>
      <section className="hero" style={{minHeight:'60vh'}}>
        <div className="hero-bg"><img src={serviceCatering} alt="Deliveries"/></div>
        <div className="hero-overlay"/>
        <div className="container">
          <div className="del-hero hero-content" style={{paddingTop:140}}>
            <p style={{color:'var(--accent)',fontWeight:600,letterSpacing:2,textTransform:'uppercase',marginBottom:12}}>📦 Delivered to Your Doorstep</p>
            <h1>Parcel & <span className="highlight">Grocery</span> Delivery</h1>
            <p>Send parcels anywhere or order fresh groceries from the nearest mandi. Fast, reliable, and affordable.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{marginTop:-60,position:'relative',zIndex:10}}>
        <div className="container">
          <div style={{display:'flex',gap:0,marginBottom:40,background:'#f3f4f6',borderRadius:'var(--radius-full)',padding:4,maxWidth:400,margin:'0 auto 40px'}}>
            <button onClick={()=>setTab('parcel')} className={`btn ${tab==='parcel'?'btn-primary':''}`} style={{flex:1,justifyContent:'center',background:tab==='parcel'?undefined:'transparent',color:tab==='parcel'?'white':'var(--text)',boxShadow:tab==='parcel'?undefined:'none'}}><Package size={18}/> Parcel</button>
            <button onClick={()=>setTab('grocery')} className={`btn ${tab==='grocery'?'btn-primary':''}`} style={{flex:1,justifyContent:'center',background:tab==='grocery'?undefined:'transparent',color:tab==='grocery'?'white':'var(--text)',boxShadow:tab==='grocery'?undefined:'none'}}><ShoppingCart size={18}/> Grocery</button>
          </div>

          <div className="grid-2">
            <div className="form-card" style={{boxShadow:'0 20px 60px rgba(0,0,0,0.12)'}}>
              <h3>{tab==='parcel'?'📦 Send a Parcel':'🥬 Order Groceries'}</h3>
              <form onSubmit={handleSubmit} style={{marginTop:20}}>
                {tab==='parcel'?(
                  <>
                    <div className="form-group"><label>Sender Name</label><input name="sender_name" className="form-input" placeholder="Your name" required/></div>
                    <div className="form-row">
                      <div className="form-group"><label>Pickup Address</label><input name="pickup_address" className="form-input" placeholder="Village / Landmark" required/></div>
                      <div className="form-group"><label>Delivery Address</label><input name="delivery_address" className="form-input" placeholder="Destination" required/></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Parcel Type</label><select name="parcel_type" className="form-input"><option>Documents</option><option>Small Package (&lt;5kg)</option><option>Medium (5-20kg)</option><option>Large/Heavy (20kg+)</option><option>Food Items</option><option>Medicine</option></select></div>
                      <div className="form-group"><label>Phone</label><input name="phone" className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" required/></div>
                    </div>
                  </>
                ):(
                  <>
                    <div className="form-group"><label>Your Name</label><input name="sender_name" className="form-input" placeholder="Full name" required/></div>
                    <div className="form-group"><label>Delivery Address</label><input name="delivery_address" className="form-input" placeholder="Village / House" required/></div>
                    <div className="form-group"><label>Grocery List</label><textarea name="grocery_list" className="form-input" placeholder="E.g. 2kg tomatoes, 1kg rice..." rows={4} style={{resize:'vertical'}} required/></div>
                    <div className="form-row">
                      <div className="form-group"><label>Preferred Time</label><select name="preferred_time" className="form-input"><option>Morning (8am-12pm)</option><option>Afternoon (12-4pm)</option><option>Evening (4-8pm)</option><option>ASAP</option></select></div>
                      <div className="form-group"><label>Phone</label><input name="phone" className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" required/></div>
                    </div>
                  </>
                )}
                <button className="btn btn-primary btn-lg" style={{width:'100%'}} type="submit">{tab==='parcel'?'Schedule Pickup':'Place Order'} <ArrowRight size={18}/></button>
              </form>
            </div>

            <div>
              <h2 style={{fontSize:28,fontWeight:800,marginBottom:8}}>{tab==='parcel'?'Send Anything, Anywhere':'Fresh from the Mandi'}</h2>
              <p style={{color:'var(--text-muted)',marginBottom:28}}>{tab==='parcel'?'Our delivery partners pick up from your doorstep and deliver safely.':'We source from local markets for the freshest produce at best prices.'}</p>
              {(tab==='parcel'?[
                {icon:<Truck size={24}/>,title:'Same-Day Delivery',desc:'Within 30km, same-day service available.'},
                {icon:<Shield size={24}/>,title:'Insured Parcels',desc:'Parcels above ₹500 are automatically insured.'},
                {icon:<MapPin size={24}/>,title:'Real-Time Tracking',desc:'Track via SMS link from pickup to delivery.'},
                {icon:<Clock size={24}/>,title:'Flexible Timing',desc:'Schedule morning, afternoon, or evening slots.'},
              ]:[
                {icon:<Box size={24}/>,title:'Farm Fresh',desc:'Sourced directly from local farms and mandis.'},
                {icon:<CheckCircle size={24}/>,title:'All Essentials',desc:'Rice, dal, oil, spices, snacks — one order.'},
                {icon:<Shield size={24}/>,title:'Quality Checked',desc:'Every item inspected before delivery.'},
                {icon:<Clock size={24}/>,title:'Within 2 Hours',desc:'Most orders delivered in under 2 hours.'},
              ]).map((item,i)=>(
                <div key={i} style={{display:'flex',gap:16,marginBottom:24,alignItems:'start'}}>
                  <div style={{width:48,height:48,borderRadius:12,background:'rgba(0,77,0,0.08)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--primary)',flexShrink:0}}>{item.icon}</div>
                  <div><h4 style={{fontWeight:600,marginBottom:4}}>{item.title}</h4><p style={{color:'var(--text-muted)',fontSize:14}}>{item.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-header"><h2>Delivery <span>Pricing</span></h2><p>Affordable rates for every delivery.</p></div>
          <div className="grid-3">
            {[
              {name:'Local',price:'₹30',sub:'Within village',features:['Up to 3km','30 min delivery','Small parcels','Cash/UPI'],f:false},
              {name:'Nearby Town',price:'₹80',sub:'3-15 km',features:['Village to town','Same-day','Up to 20kg','SMS tracking'],f:true},
              {name:'District',price:'₹200',sub:'15-50 km',features:['To district city','Next-day','Heavy packages','Insured'],f:false},
            ].map((p,i)=>(
              <div className={`price-card ${p.f?'featured':''}`} key={i}>
                <h3 style={{fontWeight:700,fontSize:20}}>{p.name}</h3>
                <div className="price-amount">{p.price}<small> / starting</small></div>
                <p style={{color:'var(--text-muted)',fontSize:14}}>{p.sub}</p>
                <ul className="price-features">{p.features.map(f=><li key={f}>✓ {f}</li>)}</ul>
                <button className="btn btn-primary" style={{width:'100%'}} onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>Book Delivery</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{maxWidth:800}}>
          <div className="section-header"><h2>Delivery <span>FAQ</span></h2></div>
          {faqs.map((f,i)=>(
            <div className="faq-item" key={i}>
              <button className="faq-question" onClick={()=>setOpenFaq(openFaq===i?null:i)}>{f.q}<ChevronDown size={20} style={{transform:openFaq===i?'rotate(180deg)':'rotate(0)',transition:'transform 0.3s'}}/></button>
              {openFaq===i&&<div className="faq-answer">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
export default DeliveriesPage;
