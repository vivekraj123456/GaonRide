import React, { useEffect } from 'react';
import { CloudSun, Droplets, Wind, Thermometer, Sun, CloudRain, CloudLightning, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../components/LanguageContext';
import { Tilt3D } from '../components/Effects3D';

// Helper to map WMO Weather Codes to Icons
const getWeatherIcon = (code: number, size = 24) => {
  if (code === 0) return <Sun size={size} color="#f59e0b" />;
  if (code <= 3) return <CloudSun size={size} color="#f59e0b" />;
  if (code <= 48) return <CloudSun size={size} color="#94a3b8" />;
  if (code <= 67) return <CloudRain size={size} color="#3b82f6" />;
  if (code <= 77) return <Droplets size={size} color="#3b82f6" />;
  if (code <= 82) return <CloudRain size={size} color="#2563eb" />;
  if (code <= 99) return <CloudLightning size={size} color="#6366f1" />;
  return <Sun size={size} color="#f59e0b" />;
};

const WeatherPage: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = React.useState(false);
  const [locationName, setLocationName] = React.useState('Lucknow Region');
  const [lastUpdated, setLastUpdated] = React.useState('Updated 2m ago');

  const initialForecast = [
    { day: 'Today', temp: 32, condition: 'Sunny', icon: <Sun size={24} color="#f59e0b" />, advice: 'Ideal for wheat sowing.' },
    { day: 'Tomorrow', temp: 29, condition: 'Light Rain', icon: <CloudRain size={24} color="#3b82f6" />, advice: 'Hold irrigation for 2 days.' },
    { day: 'Wed', temp: 30, condition: 'Partly Cloudy', icon: <CloudSun size={24} color="#f59e0b" />, advice: 'Good for fertilizer application.' },
    { day: 'Thu', temp: 33, condition: 'Sunny', icon: <Sun size={24} color="#f59e0b" />, advice: 'Check soil moisture levels.' },
    { day: 'Fri', temp: 34, condition: 'Hot', icon: <Sun size={24} color="#f59e0b" />, advice: 'Evening irrigation recommended.' },
    { day: 'Sat', temp: 28, condition: 'Thunderstorm', icon: <CloudLightning size={24} color="#6366f1" />, advice: 'Cover harvested crops.' },
    { day: 'Sun', temp: 27, condition: 'Cloudy', icon: <CloudSun size={24} color="#94a3b8" />, advice: 'Cool weather expected.' },
  ];

  const [localForecast, setLocalForecast] = React.useState(initialForecast);


  const [soilAlert, setSoilAlert] = React.useState({
    title: 'Soil Health Alert',
    content: 'Recent light rains in Chandauli and Sitapur have improved topsoil moisture. We recommend starting the primary tillage for the Rabi season within the next 48 hours for optimal germination.',
    extra: 'Current Soil Temp: 24.2°C • Optimum for Wheat'
  });

  const [pesticideWarning, setPesticideWarning] = React.useState({
    title: 'Pesticide Warning',
    content: 'Avoid spraying liquid fertilizers or pesticides on Thursday afternoon due to predicted gusty winds (up to 20 km/h). Early morning spraying is recommended for better absorption.',
    risk: 'Risk Level: Moderate • Wind Interference'
  });

  const [currentStats, setCurrentStats] = React.useState({
    temp: '32°C',
    condition: 'Mostly Sunny',
    feelsLike: '35°C',
    humidity: '65%',
    wind: '12 km/h',
    uv: 'Low'
  });


  const detectLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // 1. REVERSE GEOCODING (CITY NAME)
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
            const geoData = await geoRes.json();
            const city = geoData.address.city || geoData.address.town || geoData.address.village || 'Your Local Area';
            
            // 2. REAL WEATHER DATA (OPEN-METEO)
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;
            const weatherRes = await fetch(weatherUrl);
            const wData = await weatherRes.json();
            
            setTimeout(() => {
              setLocationName(`${city} Region`);
              setLastUpdated(`Live Update: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
              
              const current = wData.current;
              const daily = wData.daily;

              // 3. UPDATE CURRENT STATS
              setCurrentStats({
                temp: `${Math.round(current.temperature_2m)}°C`,
                condition: current.precipitation > 0 ? 'Rainy' : (current.temperature_2m > 30 ? 'Sunny' : 'Clear'),
                feelsLike: `${Math.round(current.apparent_temperature)}°C`,
                humidity: `${current.relative_humidity_2m}%`,
                wind: `${current.wind_speed_10m} km/h`,
                uv: daily.uv_index_max[0] > 6 ? 'High' : 'Moderate'
              });

              // 4. UPDATE FORECAST TABLE
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const updatedForecast = daily.time.map((dateStr: string, idx: number) => {
                const date = new Date(dateStr);
                const dayName = idx === 0 ? 'Today' : (idx === 1 ? 'Tomorrow' : days[date.getDay()]);
                const isRainy = daily.weather_code[idx] >= 51;
                
                return {
                  day: dayName,
                  dateStr: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                  temp: Math.round(daily.temperature_2m_max[idx]),
                  condition: isRainy ? 'Rainy' : 'Clear',
                  icon: getWeatherIcon(daily.weather_code[idx]),
                  advice: isRainy ? `Drain ${city} fields` : `Optimal for ${city} crops`
                };
              });
              setLocalForecast(updatedForecast);

              // 5. UPDATE ADVISORY
              const isHot = current.temperature_2m > 30;
              setSoilAlert({
                title: isHot ? 'Heat Stress Alert' : 'Moisture Watch',
                content: isHot ? `High heat detected in ${city}. Increase irrigation.` : `Manage drainage in ${city} for the next 24h.`,
                extra: `Soil Condition: ${isHot ? 'Dry' : 'Wet'}`
              });
              setPesticideWarning({
                title: 'Safe Window',
                content: current.wind_speed_10m > 15 ? `Avoid spraying in ${city} due to wind.` : `Perfect time for spraying in ${city}.`,
                risk: current.wind_speed_10m > 15 ? 'High Risk' : 'Low Risk'
              });

              setLoading(false);
              gsap.from('.weather-card', { opacity: 0, x: -30, stagger: 0.1, duration: 0.6, ease: 'back.out(1.2)' });
            }, 1000);
          } catch (err) {
            setLocationName('Current Location');
            setLoading(false);
          }
        },
        () => {
          setLoading(false);
          alert('Location access denied. Please enable it to see accurate local weather.');
        },
        { timeout: 10000 }
      );
    } else {
      setLoading(false);
      alert('Your browser doesn\'t support location services.');
    }
  };

  useEffect(() => {
    // Kill any existing animations
    gsap.killTweensOf('.weather-card');
    
    // safe delay for React render
    const timer = setTimeout(() => {
      gsap.from('.weather-card', {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="weather-page" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 80 }}>
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', color: 'white', padding: '60px 0 100px', textAlign: 'center', position: 'relative' }}>
        <div className="container" style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, marginBottom: 16 }}>Agri-Weather <span style={{ color: '#fbbf24' }}>Forecast</span></h1>
          <p style={{ opacity: 0.9, fontSize: 18, maxWidth: 600, margin: '0 auto', fontWeight: 500 }}>Advanced precision farming alerts and weather insights for <span style={{ color: '#fbbf24' }}>{locationName}</span>.</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginTop: 8 }}>{lastUpdated}</p>
          
          <button 
            onClick={detectLocation}
            disabled={loading}
            className={`btn btn-accent btn-sm ${!loading ? 'pulse-btn' : ''}`}
            style={{ marginTop: 24, boxShadow: '0 10px 20px rgba(251,191,36,0.2)', gap: 8 }}
          >
            {loading ? <div className="spinner-sm" style={{ borderColor: 'var(--text)' }}></div> : <><Info size={16} /> Detect My Area</>}
          </button>
        </div>
      </div>

      <div className="container" style={{ marginTop: -60, position: 'relative', zIndex: 10 }}>
        {/* CURRENT WEATHER OVERVIEW */}
        <div style={{ background: 'white', borderRadius: 24, padding: 40, boxShadow: '0 20px 50px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', marginBottom: 40, display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ width: 100, height: 100, borderRadius: 24, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <CloudSun size={60} />
            </div>
            <div>
              <span style={{ fontSize: 64, fontWeight: 900, color: '#1e3a8a', lineHeight: 1 }}>{currentStats.temp}</span>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-muted)' }}>{currentStats.condition} • Feels like {currentStats.feelsLike}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', background: '#f8fafc', padding: '16px 24px', borderRadius: 16 }}>
              <Droplets color="#3b82f6" style={{ marginBottom: 8 }} />
              <p style={{ fontWeight: 800, fontSize: 18 }}>{currentStats.humidity}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>HUMIDITY</p>
            </div>
            <div style={{ textAlign: 'center', background: '#f8fafc', padding: '16px 24px', borderRadius: 16 }}>
              <Wind color="#10b981" style={{ marginBottom: 8 }} />
              <p style={{ fontWeight: 800, fontSize: 18 }}>{currentStats.wind}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>WIND</p>
            </div>
            <div style={{ textAlign: 'center', background: '#f8fafc', padding: '16px 24px', borderRadius: 16 }}>
              <Thermometer color="#ef4444" style={{ marginBottom: 8 }} />
              <p style={{ fontWeight: 800, fontSize: 18 }}>{currentStats.uv}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>UV INDEX</p>
            </div>
          </div>
        </div>

        {/* 7-DAY FORECAST */}
        <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24, color: '#1e3a8a' }}>7-Day Agri-Forecast</h3>
        
        {/* SCROLLABLE TABLE FOR ABSOLUTE ROW STABILITY */}
        <div style={{ overflowX: 'auto', paddingBottom: 20, marginBottom: 40, background: 'white', borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
              <div className="spinner-sm" style={{ width: 40, height: 40, borderWidth: 4 }}></div>
              <p style={{ marginTop: 16, fontWeight: 800, color: '#1e3a8a' }}>Predicting local weather...</p>
            </div>
          )}
          <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'separate', borderSpacing: '0 16px', padding: '10px 24px' }}>
            <tbody>
              {localForecast.map((f, i) => (
                <tr key={i} className="weather-card" style={{ transition: 'all 0.3s' }}>
                  {/* 1. DAY & DATE */}
                  <td style={{ width: 160, padding: 10 }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: '#1e3a8a', margin: 0, lineHeight: 1.2 }}>{f.day}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>April {i + 1}, 2026</p>
                  </td>
                  
                  {/* 2. ICON & CONDITION */}
                  <td style={{ width: 180, padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {f.icon}
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#4b5563', whiteSpace: 'nowrap' }}>{f.condition}</span>
                    </div>
                  </td>
                  
                  {/* 3. AGRI-ADVICE PILL */}
                  <td style={{ padding: 10 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12, 
                      background: f.day === 'Tomorrow' || f.day === 'Sat' ? '#eff6ff' : '#f0fdf4', 
                      padding: '12px 24px', 
                      borderRadius: 14, 
                      border: '1px solid',
                      borderColor: f.day === 'Tomorrow' || f.day === 'Sat' ? '#dbeafe' : '#dcfce7'
                    }}>
                      <div style={{ 
                        flexShrink: 0,
                        width: 24, height: 24, borderRadius: '50%', 
                        background: f.day === 'Tomorrow' || f.day === 'Sat' ? '#3b82f6' : '#16a34a', 
                        color: 'white', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <Info size={14} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: f.day === 'Tomorrow' || f.day === 'Sat' ? '#1e40af' : '#166534', margin: 0, whiteSpace: 'nowrap' }}>
                        {f.advice}
                      </p>
                    </div>
                  </td>

                  {/* 4. TEMPERATURE */}
                  <td style={{ width: 100, textAlign: 'right', padding: 10 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: '#1e3a8a', whiteSpace: 'nowrap' }}>{f.temp}°</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AGRI ADVISORY SECTION */}
        <div className="grid-2" style={{ marginTop: 60, gap: 32 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 24, border: '1px solid #f1f5f9', boxShadow: 'var(--shadow)' }}>
            <h4 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Droplets color="#3b82f6" /> {soilAlert.title}
            </h4>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4b5563', marginBottom: 20 }}>
              {soilAlert.content}
            </p>
            <div style={{ background: '#eff6ff', padding: 16, borderRadius: 12, border: '1px solid #dbeafe', fontSize: 14, fontWeight: 600, color: '#1e40af' }}>
              {soilAlert.extra}
            </div>
          </div>
          
          <div style={{ background: 'white', padding: 32, borderRadius: 24, border: '1px solid #f1f5f9', boxShadow: 'var(--shadow)' }}>
            <h4 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <CloudLightning color="#f59e0b" /> {pesticideWarning.title}
            </h4>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4b5563', marginBottom: 20 }}>
              {pesticideWarning.content}
            </p>
            <div style={{ background: '#fff7ed', padding: 16, borderRadius: 12, border: '1px solid #ffedd5', fontSize: 14, fontWeight: 600, color: '#9a3412' }}>
              {pesticideWarning.risk}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .pulse-btn {
          animation: pulse-glow 2s infinite;
        }
        @keyframes pulse-glow {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }
      `}</style>
    </div>
  );
};

export default WeatherPage;
