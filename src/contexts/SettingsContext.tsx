import React, { createContext, useContext, useState, useEffect } from 'react';

export interface OfficeSettings {
  id: string;
  name: string;
  active_areas: ('trabalhista' | 'civil' | 'criminal' | 'previdenciario' | 'tributario')[];
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

interface SettingsContextType {
  settings: OfficeSettings | null;
  loading: boolean;
  updateSettings: (settings: Partial<OfficeSettings>) => Promise<void>;
  isAreaEnabled: (area: string) => boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<OfficeSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar configurações do localStorage
    const saved = localStorage.getItem('whp_office');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      }
    } else {
      // Configuração padrão
      const defaultSettings: OfficeSettings = {
        id: 'office-001',
        name: 'Alves & Associados Advocacia',
        active_areas: ['trabalhista', 'civil', 'criminal', 'previdenciario', 'tributario'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSettings(defaultSettings);
      localStorage.setItem('whp_office', JSON.stringify(defaultSettings));
    }
    setLoading(false);
  }, []);

  const updateSettings = async (updates: Partial<OfficeSettings>) => {
    if (!settings) return;
    
    const updated = {
      ...settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    setSettings(updated);
    localStorage.setItem('whp_office', JSON.stringify(updated));
  };

  const isAreaEnabled = (area: string): boolean => {
    return settings?.active_areas.includes(area as any) ?? false;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, isAreaEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings deve ser usado dentro de SettingsProvider');
  }
  return context;
}
