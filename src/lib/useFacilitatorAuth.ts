import { useState, useEffect } from 'react';

const AUTH_KEY = 'udp_cmei_facilitator_auth_v1';

export function useFacilitatorAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithPin = async (pin: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem(AUTH_KEY, 'true');
        } catch {
          // ignore
        }
        return true;
      } else {
        setError(data.error || 'PIN incorrecto. Revisa e inténtalo otra vez.');
        return false;
      }
    } catch (err: any) {
      console.error('Error al conectar con /api/pin:', err);
      // Fallback si la API no está disponible (ej. entorno puramente estático)
      const fallbackPin = '2110';
      if (pin.trim() === fallbackPin) {
        setIsAuthenticated(true);
        sessionStorage.setItem(AUTH_KEY, 'true');
        return true;
      }
      setError('Error al verificar el PIN con el servidor. Revisa tu conexión.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
  };

  return {
    isAuthenticated,
    isLoading,
    error,
    loginWithPin,
    logout,
    clearError: () => setError(null),
  };
}
