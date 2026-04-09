import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Singleton instance to prevent "Multiple GoTrueClient" warning
export const supabase = globalThis.__supabase || createClient(supabaseUrl, supabaseAnonKey);
if (typeof window !== 'undefined') globalThis.__supabase = supabase;

/**
 * Supabase helper functions for CampusBook
 * These mirror the Firebase API layer for easy migration
 */

// --- AUTH HELPERS ---

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signInWithPhone(phone) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phone,
  });
  if (error) throw error;
  return data;
}

export async function verifyPhoneOtp(phone, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone,
    token: token,
    type: 'sms',
  });
  if (error) throw error;
  return data;
}

export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => {
    subscription.unsubscribe();
  };
}

// --- PROFILE HELPERS ---

export async function getProfile(uid) {
  try {
    // 1. Core select (most common fields)
    let fetchResult = await supabase
      .from('user_profiles')
      .select('id, name, email, role, college, avatar, incomplete')
      .eq('id', uid)
      .single();

    if (fetchResult.error) {
      // 2. Minimalist fallback (just id and role) if core select failed due to cache (406)
      if (fetchResult.error.status === 406) {
        console.warn("Retrying with minimalist profile fetch...");
        fetchResult = await supabase
          .from('user_profiles')
          .select('id, role')
          .eq('id', uid)
          .single();
      }
    }

    if (fetchResult.error) {
      if (fetchResult.error.status === 406 || fetchResult.error.code === 'PGRST116' || fetchResult.error.code === 'PGRST114') {
        return null;
      }
      throw fetchResult.error;
    }
    
    return fetchResult.data;
  } catch (err) {
    if (err?.status !== 406) {
      console.error("Profile fetch critical failure:", err.code || err.status, err.message);
    }
    return null;
  }
}

export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profile)
    .select();
  if (error) throw error;
  return data?.[0];
}

// --- DATABASE HELPERS ---

// Proposals
export async function getProposals() {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveProposal(proposal) {
  const { id, ...rest } = proposal;
  const { data, error } = await supabase
    .from('proposals')
    .upsert({ 
        ...(id ? { id } : {}), 
        ...rest, 
        updated_at: new Date().toISOString() 
    })
    .select();
  if (error) throw error;
  return data?.[0];
}

// Venues
export async function getVenues() {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function saveVenue(venue) {
  const { id, ...rest } = venue;
  const { data, error } = await supabase
    .from('venues')
    .upsert({ 
        ...(id ? { id } : {}), 
        ...rest 
    })
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteVenue(id) {
  const { error } = await supabase
    .from('venues')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Attendance
export async function saveAttendanceSession(session) {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .upsert(session)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateAttendanceSession(id, updates) {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function markAttendance(record) {
  const { data, error } = await supabase
    .from('attendance')
    .upsert(record)
    .select();
  if (error) throw error;
  return data?.[0];
}

// User Profile Registry
export async function saveUserProfile(profile) {
  return await upsertProfile(profile);
}

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveNotification(notification) {
    const { id, ...rest } = notification;
    const { data, error } = await supabase
      .from('notifications')
      .upsert({ 
          ...(id ? { id } : {}), 
          ...rest 
      })
      .select();
    if (error) throw error;
    return data?.[0];
}

export async function markNotifRead(notifId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId);
    if (error) throw error;
}

// Bookings
export async function getBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveBooking(booking) {
  const { id, ...rest } = booking;
  const { data, error } = await supabase
    .from('bookings')
    .upsert({ 
        ...(id ? { id } : {}), 
        ...rest 
    })
    .select();
  if (error) throw error;
  return data?.[0];
}

// Booking History
export async function saveBookingHistory(historyEntry) {
    const { venueId, eventType, status } = historyEntry;
    
    // In Supabase, we can use an 'upsert' with an incrementing logic if we had a function,
    // but for simple migration we'll replicate the Firebase 'fetch then update' logic here.
    const { data: existing } = await supabase
        .from('booking_history')
        .select('*')
        .eq('venue_id', venueId)
        .eq('event_type', eventType)
        .single();
    
    let stats = existing || { total: 0, approvals: 0, approval_rate: 0.5 };
    stats.total += 1;
    if (status === 'approved') stats.approvals += 1;
    stats.approval_rate = stats.approvals / stats.total;
    
    const { error } = await supabase
        .from('booking_history')
        .upsert({
            venue_id: venueId,
            event_type: eventType,
            ...stats,
            last_updated: new Date().toISOString()
        });
    if (error) throw error;
}

// Chat
export async function getChatMessages(channel = 'general', limit = 50) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('channel', channel)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function sendChatMessage(message) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{ ...message, created_at: new Date().toISOString() }])
    .select();
  if (error) throw error;
  return data?.[0];
}

// --- SUBSCRIPTIONS ---

export function subscribeToTable(table, callback, filter = null) {
  let channelName = `public:${table}`;
  if (filter) {
      channelName += `:${filter.column}=${filter.value}`;
  }
  
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: table,
      ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {})
    }, (payload) => {
      // Callback with the whole state is usually better for app usage
      // but to match onSnapshot we might need more logic in the caller.
      // For now, let's just trigger the callback.
      callback(payload);
    })
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}

