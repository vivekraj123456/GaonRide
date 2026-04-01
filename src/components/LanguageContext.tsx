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
