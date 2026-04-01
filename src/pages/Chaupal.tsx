import React, { useState, useEffect } from 'react';
import { Heart, Share2, Star, MessageSquare, Plus, Filter, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../components/LanguageContext';
import { Tilt3D } from '../components/Effects3D';
import { useToast } from '../components/Toast';

interface Post {
  id: number;
  author: string;
  village: string;
  category: string;
  text: string;
  likes: number;
  icon: React.ReactNode;
  color: string;
  date: string;
  liked?: boolean;
}

const ChaupalPage: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState('all');
  const [posts, setPosts] = useState<Post[]>([
    { id: 1, author: 'Rajesh from Rampur', village: 'Rampur', category: 'success', text: 'Managed to double my crop yield using GaonRide\'s tractor hiring service! The driver was very professional and the equipment was top-notch.', likes: 24, icon: <Star size={20} />, color: '#f59e0b', date: '2 hours ago' },
    { id: 2, author: 'Anita G.', village: 'Chandauli', category: 'help', text: 'Big thanks to Driver Mohan for helping my elderly mother reaching hospital on time during last night\'s rain. Truly a lifesaver!', likes: 45, icon: <Heart size={20} />, color: '#ef4444', date: '5 hours ago' },
    { id: 3, author: 'GaonRide Team', village: 'Admin', category: 'news', text: 'We now have 5 new SUVs available in Chandauli district. Special 20% discount for first-time wedding bookings this month!', likes: 12, icon: <MessageSquare size={20} />, color: '#3b82f6', date: '1 day ago' },
    { id: 4, author: 'Suresh Kumar', village: 'Bariapur', category: 'success', text: 'Used GaonRide for my daughter\'s wedding transportation. 10 cars reached on time and the decorations were beautiful.', likes: 38, icon: <Star size={20} />, color: '#f59e0b', date: '2 days ago' },
    { id: 5, author: 'Mahesh P.', village: 'Saidpur', category: 'news', text: 'Great news! Mandi prices for Wheat are up by ₹50 today. Check the live ticker on the home page.', likes: 19, icon: <MessageSquare size={20} />, color: '#3b82f6', date: '3 days ago' },
    { id: 6, author: 'Priyanka S.', village: 'Hajipur', category: 'help', text: 'Found a lost wallet near the bus stand. Contacted GaonRide support and they helped return it to the owner within an hour!', likes: 56, icon: <Heart size={20} />, color: '#ef4444', date: '4 days ago' },
  ]);

  const [showPostForm, setShowPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ name: '', text: '', category: 'success' });

  const filteredPosts = activeFilter === 'all' 
    ? posts 
    : posts.filter((p: Post) => p.category === activeFilter);

  useEffect(() => {
    // Kill any existing animations to prevent conflicts
    gsap.killTweensOf('.chaupal-card');
    
    // Use a small delay to ensure React has updated the DOM
    const timer = setTimeout(() => {
      const cards = document.querySelectorAll('.chaupal-card');
      if (cards.length > 0) {
        gsap.from(cards, {
          opacity: 0,
          y: 30,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power2.out',
          clearProps: 'all'
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeFilter, posts.length]);

  const handleLike = (id: number) => {
    setPosts(posts.map((p: Post) => p.id === id ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked } : p));
    
    // Simple heart animation simulation
    const btn = document.getElementById(`like-btn-${id}`);
    if (btn) {
      gsap.to(btn, { scale: 1.4, duration: 0.1, yoyo: true, repeat: 1 });
    }
  };

  const handleShare = (author: string) => {
    if (navigator.share) {
      navigator.share({ title: 'GaonRide Chaupal', text: `Check out this story from ${author} on GaonRide!` });
    } else {
      showToast('🔗 Link copied to clipboard!');
    }
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.name || !newPost.text) return;
    
    const post = {
      id: posts.length + 1,
      author: newPost.name,
      village: 'Your Village',
      category: newPost.category,
      text: newPost.text,
      likes: 0,
      icon: newPost.category === 'success' ? <Star size={20} /> : newPost.category === 'help' ? <Heart size={20} /> : <MessageSquare size={20} />,
      color: newPost.category === 'success' ? '#f59e0b' : newPost.category === 'help' ? '#ef4444' : '#3b82f6',
      date: 'Just now'
    };
    
    setPosts([post, ...posts]);
    setNewPost({ name: '', text: '', category: 'success' });
    setShowPostForm(false);
  };

  return (
    <div className="chaupal-page" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 100 }}>
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', color: 'white', padding: '80px 0 120px', textAlign: 'center', position: 'relative' }}>
        <div className="container" style={{ position: 'relative' }}>
          <Link to="/" style={{ position: 'absolute', top: -40, left: 0, color: 'white', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, opacity: 0.8 }}>
            <ArrowLeft size={18} /> Back Home
          </Link>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16, letterSpacing: '-1px' }}>Digital <span style={{ color: 'var(--accent)' }}>Chaupal</span></h1>
          <p style={{ opacity: 0.9, fontSize: 19, maxWidth: 700, margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>A vibrant space for our community to share success stories, helpful tips, and daily updates from across the villages.</p>
        </div>
      </div>

      <div className="container" style={{ marginTop: -60, position: 'relative', zIndex: 10 }}>
        {/* FILTERS & POST BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, gap: 20, flexWrap: 'wrap', background: 'white', padding: '16px 24px', borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 5, borderRadius: 100, gap: 4 }}>
            {['all', 'success', 'help', 'news'].map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 100,
                  border: 'none',
                  background: activeFilter === f ? 'var(--primary)' : 'transparent',
                  color: activeFilter === f ? 'white' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowPostForm(true)}
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0,77,0,0.2)' }}
          >
            <Plus size={20} /> Share Your Story
          </button>
        </div>

        {/* FEED */}
        <div className="grid-3" style={{ gap: '30px' }}>
          {filteredPosts.map((post: Post) => (
            <Tilt3D key={post.id}>
              <div className="chaupal-card" style={{ 
                background: 'white', 
                borderRadius: 24, 
                padding: 30, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 15px 45px rgba(0,0,0,0.05)',
                border: '1px solid #f1f5f9',
                willChange: 'transform, opacity'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 48, height: 48, borderRadius: 14, 
                      background: post.color, color: 'white', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 8px 16px ${post.color}33`
                    }}>
                      {post.icon}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', marginBottom: 2 }}>{post.author}</h4>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{post.village}</span>
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: 10, fontWeight: 900, textTransform: 'uppercase', 
                    padding: '4px 10px', borderRadius: 6, 
                    background: post.category === 'success' ? '#fff7ed' : post.category === 'help' ? '#fff1f0' : '#eff6ff',
                    color: post.color 
                  }}>
                    {post.category}
                  </span>
                </div>
                
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4b5563', fontWeight: 500, flex: 1, marginBottom: 24 }}>
                  "{post.text}"
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button 
                      id={`like-btn-${post.id}`}
                      onClick={() => handleLike(post.id)}
                      style={{ 
                        background: 'none', border: 'none', 
                        display: 'flex', alignItems: 'center', gap: 6, 
                        color: post.liked ? '#ef4444' : 'var(--text-muted)', 
                        fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <Heart size={18} fill={post.liked ? '#ef4444' : 'none'} /> {post.likes}
                    </button>
                    <button 
                      onClick={() => handleShare(post.author)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{post.date}</span>
                </div>
              </div>
            </Tilt3D>
          ))}
        </div>
      </div>

      {/* POST MODAL */}
      {showPostForm && (
        <div className="modal-overlay" style={{ padding: 20 }}>
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Share Your Story</h3>
              <button className="close-btn" onClick={() => setShowPostForm(false)}>&times;</button>
            </div>
            <form className="modal-body" onSubmit={handlePostSubmit}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Your Name</label>
                <input 
                  type="text" className="form-input" required 
                  value={newPost.name} onChange={e => setNewPost({...newPost, name: e.target.value})}
                  placeholder="e.g. Ramesh Singh"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Category</label>
                <select 
                  className="form-input" 
                  value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})}
                >
                  <option value="success">Success Story</option>
                  <option value="help">Appreciation/Help</option>
                  <option value="news">Local Updates</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 25 }}>
                <label className="form-label">Your Message</label>
                <textarea 
                  className="form-input" rows={4} required
                  value={newPost.text} onChange={e => setNewPost({...newPost, text: e.target.value})}
                  placeholder="Tell the community what happened..."
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Send size={18} /> Post to Chaupal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChaupalPage;
