import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { subscribeToCollection, saveVenue, deleteVenue as dbDeleteVenue } from '../api';
import { useAuth } from './AuthContext';
import { MOCK_VENUES } from '../utils/mockData';

const VenueContext = createContext(null);

export function VenueProvider({ children }) {
  const { selectedCollege } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedCollege?.id) return;

    const unsub = subscribeToCollection('venues', (data) => {
      let filtered = data.filter(v => v.collegeId === selectedCollege.id);
      if (filtered.length === 0) {
          filtered = MOCK_VENUES; // Fallback to mock data if backend comes back empty due to 404
      }
      setVenues(filtered);
      setLoading(false);
    });

    return () => unsub();
  }, [selectedCollege]);

  const addVenue = useCallback(async (venue) => {
    const newVenue = { 
      ...venue, 
      id: `v${Date.now()}`,
      collegeId: selectedCollege?.id,
      createdAt: new Date().toISOString()
    };
    await saveVenue(newVenue);
  }, [selectedCollege]);

  const updateVenue = useCallback(async (id, updates) => {
    const venue = venues.find(v => v.id === id);
    if (!venue) return;
    
    await saveVenue({ ...venue, ...updates });
  }, [venues]);

  const deleteVenue = useCallback(async (id) => {
    await dbDeleteVenue(id);
  }, []);

  return (
    <VenueContext.Provider value={{ venues, loading, addVenue, updateVenue, deleteVenue }}>
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

