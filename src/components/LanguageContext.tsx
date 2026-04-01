import React, { createContext, useContext, useState, useCallback } from 'react';

type Lang = 'en' | 'hi';

const translations: Record<string, Record<Lang, string>> = {
  // Navbar
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.rides': { en: 'Rides', hi: 'सवारी' },
  'nav.deliveries': { en: 'Deliveries', hi: 'डिलीवरी' },
  'nav.events': { en: 'Events', hi: 'कार्यक्रम' },
  'nav.partner': { en: 'Become a Partner', hi: 'पार्टनर बनें' },
  'nav.contact': { en: 'Contact', hi: 'संपर्क' },
  'nav.bookNow': { en: 'Book Now', hi: 'अभी बुक करें' },

  // Hero
  'hero.empowering': { en: 'Empowering Rural India', hi: 'ग्रामीण भारत को सशक्त बनाना' },
  'hero.title1': { en: 'Your Village,', hi: 'आपका गाँव,' },
  'hero.title2': { en: 'Connected', hi: 'जुड़ा हुआ' },
  'hero.toWorld': { en: 'to the World', hi: 'दुनिया से' },
  'hero.desc': { en: 'From reliable daily rides and quick parcel deliveries to complete wedding planning — GaonRide brings top-tier services directly to your doorstep.', hi: 'विश्वसनीय दैनिक सवारी और तेज़ पार्सल डिलीवरी से लेकर पूर्ण शादी की योजना तक — गाँवराइड सीधे आपके दरवाजे तक शीर्ष सेवाएं लाता है।' },
  'hero.bookRide': { en: 'Book a Ride', hi: 'सवारी बुक करें' },
  'hero.planEvent': { en: 'Plan an Event', hi: 'कार्यक्रम बनाएं' },

  // Quick Actions
  'qa.ride': { en: 'Book a Ride', hi: 'सवारी बुक करें' },
  'qa.tractor': { en: 'Tractor Hire', hi: 'ट्रैक्टर किराये' },
  'qa.parcel': { en: 'Parcel Delivery', hi: 'पार्सल डिलीवरी' },
  'qa.wedding': { en: 'Wedding Services', hi: 'शादी सेवाएं' },

  // Buttons
  'btn.submit': { en: 'Submit', hi: 'जमा करें' },
  'btn.trackOrder': { en: 'Track Order', hi: 'ऑर्डर ट्रैक करें' },

  // Emergency
  'emergency.title': { en: 'Emergency Contacts', hi: 'आपातकालीन संपर्क' },
  'emergency.ambulance': { en: 'Ambulance', hi: 'एम्बुलेंस' },
  'emergency.police': { en: 'Police', hi: 'पुलिस' },
  'emergency.fire': { en: 'Fire', hi: 'दमकल' },
  'emergency.helpline': { en: 'GaonRide Help', hi: 'गाँवराइड हेल्प' },

  // Mandi & Hub
  'hub.mandiTitle': { en: 'Live Mandi Prices', hi: 'लाइव मंडी भाव' },
  'hub.weatherTitle': { en: 'Agri-Weather Advice', hi: 'कृषि-मौसम सलाह' },
  'hub.chaupalTitle': { en: 'Digital Chaupal', hi: 'डिजिटल चौपाल' },
  'hub.viewMore': { en: 'View More', hi: 'और देखें' },
  'track.title': { en: 'Track My Order', hi: 'ऑर्डर चेक करें' },
  'track.subtitle': { en: 'Enter your phone number to check status', hi: 'स्थिति जांचने के लिए फोन नंबर डालें' },
  'track.placeholder': { en: '+91 XXXXX XXXXX', hi: 'अपना फोन नंबर डालें' },
  'track.button': { en: 'Track', hi: 'चेक करें' },
  'track.noResults': { en: 'No orders found for this number.', hi: 'इस नंबर के लिए कोई ऑर्डर नहीं मिला।' },
  'track.parcel': { en: 'Parcel', hi: 'पार्सल' },
  'track.grocery': { en: 'Grocery', hi: 'किराना' },
  'track.ride': { en: 'Ride', hi: 'सवारी' },
  'track.status.pending': { en: 'Pending', hi: 'पेंडिंग' },
  'track.status.confirmed': { en: 'Confirmed', hi: 'कन्फर्म' },
  'track.status.completed': { en: 'Completed', hi: 'पूरा हुआ' },
  'track.status.cancelled': { en: 'Cancelled', hi: 'रद्द' },
  'track.status.delivered': { en: 'Delivered', hi: 'पहुंच गया' },
  'hub.advice.sowing': { en: 'Ideal time for Wheat sowing. Ensure proper soil moisture.', hi: 'गेहूं की बुवाई के लिए आदर्श समय। मिट्टी में उचित नमी सुनिश्चित करें।' },
  'hub.advice.irrigation': { en: 'Light rain expected tomorrow. Delay irrigation by 2 days.', hi: 'कल हल्की बारिश की संभावना है। सिंचाई में 2 दिन की देरी करें।' },
  
  // Crops
  'crop.wheat': { en: 'Wheat', hi: 'गेहूं' },
  'crop.rice': { en: 'Rice (Paddy)', hi: 'धान' },
  'crop.mustard': { en: 'Mustard', hi: 'सरसों' },
  'crop.potato': { en: 'Potato', hi: 'आलू' },
  'crop.onion': { en: 'Onion', hi: 'प्याज' },
  'crop.cotton': { en: 'Cotton', hi: 'कपास' },
  'crop.soyabean': { en: 'Soyabean', hi: 'सोयाबीन' },
  'crop.maize': { en: 'Maize (Makka)', hi: 'मक्का' },
  'crop.moong': { en: 'Moong Dal', hi: 'मूँग दाल' },
  'crop.chana': { en: 'Gram (Chana)', hi: 'चना' },
  'crop.turmeric': { en: 'Turmeric (Haldi)', hi: 'हल्दी' },
  'crop.garlic': { en: 'Garlic (Lehsun)', hi: 'लहसुन' },
  'crop.coriander': { en: 'Coriander (Dhania)', hi: 'धनिया' },
  'crop.cumin': { en: 'Cumin (Jeera)', hi: 'जीरा' },
  'crop.bajra': { en: 'Bajra', hi: 'बाजरा' },
  'crop.jowar': { en: 'Jowar', hi: 'ज्वार' },
  'crop.urad': { en: 'Urad Dal', hi: 'उड़द दाल' },
  'crop.masur': { en: 'Masur Dal', hi: 'मसूर दाल' },
  'crop.til': { en: 'Sesame (Til)', hi: 'तिल' },
  'crop.groundnut': { en: 'Groundnut', hi: 'मूंगफली' },
  'crop.sunflower': { en: 'Sunflower', hi: 'सूरजमुखी' },
  'crop.barley': { en: 'Barley (Jau)', hi: 'जौ' },
  'crop.tomato': { en: 'Tomato', hi: 'टमाटर' },
  'crop.chilli': { en: 'Dry Chilli', hi: 'सूखी लाल मिर्च' },
 
  'hub.mandiSearchPlaceholder': { en: 'Search crop (Wheat, Cotton...)', hi: 'फसल खोजें (गेहूं, कपास...)' },

  // Voice
  'voice.listening': { en: 'Listening...', hi: 'सुन रहे हैं...' },
  'voice.howCanHelp': { en: 'How can I help you today?', hi: 'आज मैं आपकी कैसे मदद कर सकता हूँ?' },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('gaonride-lang') as Lang) || 'en';
  });

  const changeLang = useCallback((l: Lang) => {
    setLang(l);
    localStorage.setItem('gaonride-lang', l);
  }, []);

  const t = useCallback((key: string) => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
