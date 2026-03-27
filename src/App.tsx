import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastProvider } from './components/Toast';
import HomePage from './pages/Home';
import RidesPage from './pages/Rides';
import DeliveriesPage from './pages/Deliveries';
import EventsPage from './pages/Events';
import PartnerPage from './pages/Partner';
import ContactPage from './pages/Contact';
import AdminPage from './pages/Admin';

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
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <Layout />
      </ToastProvider>
    </Router>
  );
};

export default App;

