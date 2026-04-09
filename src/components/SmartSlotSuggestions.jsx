import { useState, useEffect } from 'react';
import { Sparkles, Calendar, AlertCircle, ChevronRight } from 'lucide-react';
import { getTopSlots } from '../utils/slotSuggester';
import SlotScoreBar from './SlotScoreBar';
import { useAuth } from '../contexts/AuthContext';

const SmartSlotSuggestions = ({ 
  venueId, 
  eventType, 
  durationMinutes, 
  preferredDate, 
  onConfirm, 
  onOpenCalendar 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSuggestions() {
      if (!venueId || !eventType || !durationMinutes || !preferredDate) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const societyId = user?.uid || user?.id;
        const slots = await getTopSlots(venueId, eventType, durationMinutes, preferredDate, societyId);
        setSuggestions(slots);
      } catch (err) {
        console.error("Failed to load suggestions:", err);
        setError("Couldn't load suggestions — you can still pick manually");
      } finally {
        setLoading(false);
      }
    }

    loadSuggestions();
  }, [venueId, eventType, durationMinutes, preferredDate, user]);

  const formatDateRange = (start, end) => {
    const dateStr = start.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short' 
    });
    const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} · ${startTime} – ${endTime}`;
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'green';
    if (score >= 50) return 'amber';
    return 'gray';
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <Sparkles className="w-4 h-4 text-gray-300 animate-spin" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col items-center gap-3 text-center border border-gray-100">
        <AlertCircle className="text-gray-400 w-8 h-8" />
        <p className="text-sm text-gray-500">{error}</p>
        <button 
          onClick={onOpenCalendar}
          className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
        >
          Open calendar <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center border border-dashed border-gray-300">
        <p className="text-sm text-gray-500 mb-3">
          No available slots in the next 14 days for this venue. Try a different venue or extend your window.
        </p>
        <button 
          onClick={onOpenCalendar}
          className="text-primary text-sm font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
        >
          Open calendar <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-[16px] font-medium text-gray-800 dark:text-gray-200">Recommended slots</h3>
        <Sparkles className="w-4 h-4 text-primary animate-bounce text-yellow-500" />
      </div>

      <div className="flex flex-col gap-3">
        {suggestions.map((item, index) => {
          const scoreColor = getScoreColor(item.score);
          const isRank1 = index === 0;
          const isRank2 = index === 1;
          
          let cardClasses = "p-4 border-l-4 rounded-r-lg flex flex-col gap-2 transition-all hover:translate-x-1 ";
          if (isRank1) cardClasses += "border-green-500 bg-green-50 dark:bg-green-950/20";
          else if (isRank2) cardClasses += "border-amber-400 bg-amber-50 dark:bg-amber-950/20";
          else cardClasses += "border-gray-300 bg-gray-50 dark:bg-gray-800/20";

          return (
            <div key={index} className={cardClasses}>
              <div className="flex justify-between items-center">
                <span className="text-[15px] font-medium text-gray-800 dark:text-gray-100">
                  {formatDateRange(item.slot.start, item.slot.end)}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  scoreColor === 'green' ? 'bg-green-100 text-green-700' : 
                  scoreColor === 'amber' ? 'bg-amber-100 text-amber-700' : 
                  'bg-gray-200 text-gray-700'
                }`}>
                  {item.score} / 100
                </span>
              </div>

              <SlotScoreBar score={item.score} color={scoreColor} />

              <div className="flex items-center justify-between mt-1">
                <span className={`text-[11px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                  scoreColor === 'green' ? 'bg-green-200/50 text-green-800 dark:text-green-200' : 
                  scoreColor === 'amber' ? 'bg-amber-200/50 text-amber-800 dark:text-amber-200' : 
                  'bg-gray-200/50 text-gray-800 dark:text-gray-200'
                }`}>
                  {item.label}
                </span>
                <span className="text-[13px] italic opacity-80 flex-1 ml-3 text-right text-gray-600 dark:text-gray-400">
                  {item.reason}
                </span>
              </div>

              <button
                onClick={() => onConfirm(item.slot)}
                className={`w-full mt-2 py-2 rounded-md text-sm font-semibold transition-all shadow-sm ${
                  isRank1 
                    ? 'bg-green-600 hover:bg-green-700 text-white active:scale-95' 
                    : 'border-2 border-current hover:bg-white/10 active:scale-95'
                }`}
              >
                Book this slot
              </button>
            </div>
          );
        })}
      </div>

      <button 
        onClick={onOpenCalendar}
        className="w-full flex items-center justify-center gap-2 text-primary hover:text-primary-dark font-medium py-2 transition-all mt-2"
      >
        View all available times <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default SmartSlotSuggestions;
