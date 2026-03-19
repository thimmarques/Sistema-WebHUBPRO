import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToastContext } from '@/contexts/ToastContext';

export interface OfficeSettings {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  logo_url?: string;
  active_areas: ('trabalhista' | 'civil' | 'criminal' | 'previdenciario' | 'tributario')[];
}

export function useOfficeSettings() {
  const [settings, setSettings] = useState<OfficeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastContext();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('office_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data as OfficeSettings);
      }
    } catch (err: any) {
      console.error('Erro ao carregar configurações do escritório:', err);
      showToast('Erro ao carregar configurações do escritório', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const saveSettings = async (updates: Partial<OfficeSettings>) => {
    try {
      if (!settings?.id) {
        throw new Error('Configuração não inicializada');
      }

      const { data, error } = await supabase
        .from('office_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data as OfficeSettings);
        showToast('Configurações salvas com sucesso', 'success');
      }
      return true;
    } catch (err: any) {
      console.error('Erro ao salvar as configurações:', err);
      showToast('Erro ao salvar as configurações', 'error');
      return false;
    }
  };

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    saveSettings,
    refresh: loadSettings
  };
}
