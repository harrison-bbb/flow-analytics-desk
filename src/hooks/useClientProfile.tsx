import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ClientProfile {
  id?: string;
  user_id: string;
  business_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
  address?: string;
  website?: string;
}

export const useClientProfile = () => {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('client_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error fetching client profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<ClientProfile>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const profileData = {
        user_id: user.id,
        ...updates,
      };

      const { data, error: updateError } = await supabase
        .from('client_profile')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating client profile:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
};