// Admin authentication helper functions
import { supabase } from '../services/supabaseClient';

export const checkUserRole = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      // If profile doesn't exist, treat as regular user (intern)
      return 'intern';
    }

    // Normalize role: trim whitespace and convert to lowercase
    const cleanRole = profile.role ? profile.role.trim().toLowerCase() : null;
    
    return profile.is_active ? cleanRole : null;
  } catch (error) {
    console.error('Error checking user role:', error);
    return 'intern'; // Default to intern on error
  }
};

export const isAdmin = async () => {
  const role = await checkUserRole();
  return role === 'admin';
};

export const createUserProfile = async (userId, email, role = 'intern') => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        id: userId,
        email: email,
        role: role,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
};
