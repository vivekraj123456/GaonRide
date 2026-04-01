import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton: React.FC = () => {
  return (
    <a
      href="https://wa.me/917301132018?text=Hi%20GaonRide!%20I%20need%20help."
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={28} />
      <span className="whatsapp-tooltip">Chat with us!</span>
    </a>
  );
};

export default WhatsAppButton;
