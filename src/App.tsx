import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastProvider } from './components/Toast';
import { LanguageProvider } from './components/LanguageContext';
import WhatsAppButton from './components/WhatsAppButton';
import BackToTop from './components/BackToTop';
import InstallBanner from './components/InstallBanner';
import HomePage from './pages/Home';
import RidesPage from './pages/Rides';
import DeliveriesPage from './pages/Deliveries';
import EventsPage from './pages/Events';
import PartnerPage from './pages/Partner';
import ContactPage from './pages/Contact';
import AdminPage from './pages/Admin';
import ChaupalPage from './pages/Chaupal';
import WeatherPage from './pages/Weather';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const isAdmin = pathname === '/admin';

  return (
    <>
      {!isAdmin && <InstallBanner />}
      {!isAdmin && <Navbar />}
      <ScrollToTop />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rides" element={<RidesPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/partner" element={<PartnerPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/chaupal" element={<ChaupalPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppButton />}
      {!isAdmin && <BackToTop />}
    </>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <LanguageProvider>
        <ToastProvider>
          <Layout />
        </ToastProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;

