import { createContext, useContext, useState, useCallback } from 'react';
import { MOCK_VENUES } from '../utils/mockData';

const VenueContext = createContext(null);

export function VenueProvider({ children }) {
  const [venues, setVenues] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbook_venues');
      return saved ? JSON.parse(saved) : MOCK_VENUES;
    } catch {
      return MOCK_VENUES;
    }
  });

  const save = useCallback((data) => {
    try { localStorage.setItem('campusbook_venues', JSON.stringify(data)); } catch {}
  }, []);

  const addVenue = useCallback((venue) => {
    setVenues(prev => {
      const updated = [...prev, { ...venue, id: `v${Date.now()}` }];
      save(updated);
      return updated;
    });
  }, [save]);

  const updateVenue = useCallback((id, updates) => {
    setVenues(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, ...updates } : v);
      save(updated);
      return updated;
    });
  }, [save]);

  const deleteVenue = useCallback((id) => {
    setVenues(prev => {
      const updated = prev.filter(v => v.id !== id);
      save(updated);
      return updated;
    });
  }, [save]);

  return (
    <VenueContext.Provider value={{ venues, addVenue, updateVenue, deleteVenue }}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenues() {
  const ctx = useContext(VenueContext);
  if (!ctx) throw new Error('useVenues must be used within VenueProvider');
  return ctx;
}

export default VenueContext;
