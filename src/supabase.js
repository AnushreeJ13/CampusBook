import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Supabase helper functions for CampusBook
 * These mirror the Firebase API layer for easy migration
 */

// Auth helpers
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

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}

// Database helpers - Proposals
export async function getProposals() {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addProposal(proposal) {
  const { data, error } = await supabase
    .from('proposals')
    .insert([{ ...proposal, created_at: new Date().toISOString() }])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateProposal(id, updates) {
  const { data, error } = await supabase
    .from('proposals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

// Database helpers - Venues
export async function getVenues() {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

// Database helpers - Chat Messages
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

// Real-time subscription for chat
export function subscribeToChatMessages(channel, callback) {
  return supabase
    .channel(`chat:${channel}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `channel=eq.${channel}`
    }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
}

// Notifications
export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
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

export async function addBooking(booking) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([{ ...booking, created_at: new Date().toISOString() }])
    .select();
  if (error) throw error;
  return data?.[0];
}
