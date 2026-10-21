/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { Note } from './types.ts';
import { subscribeNotes, subscribeConnectionState } from './lib/firebase.ts';
import { useFacilitatorAuth } from './lib/useFacilitatorAuth.ts';
import { ParticipantView } from './components/ParticipantView.tsx';
import { FacilitatorPanel } from './components/FacilitatorPanel.tsx';
import { PinModal } from './components/PinModal.tsx';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    loginWithPin,
    logout,
    clearError,
  } = useFacilitatorAuth();

  // Gestión de navegación sin recargar (SPA router)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Suscripción en tiempo real a Firebase Realtime Database
  useEffect(() => {
    const unsubscribeNotes = subscribeNotes(
      (data) => {
        setNotes(data);
        setFirebaseError(null);
      },
      (err) => {
        setFirebaseError(err.message);
      }
    );

    const unsubscribeConn = subscribeConnectionState((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribeNotes();
      unsubscribeConn();
    };
  }, []);

  // Determinar si estamos en la ruta de facilitadora
  const isFacilitatorRoute = currentPath === '/panel' || currentPath.startsWith('/panel');

  if (isFacilitatorRoute) {
    if (!isAuthenticated) {
      return (
        <PinModal
          onLogin={async (pin) => {
            return await loginWithPin(pin);
          }}
          onCancel={() => navigateTo('/')}
          isLoading={isAuthLoading}
          error={authError}
          clearError={clearError}
        />
      );
    }

    return (
      <FacilitatorPanel
        notes={notes}
        isConnected={isConnected}
        onLogout={() => {
          logout();
          navigateTo('/');
        }}
        onGoToParticipantView={() => navigateTo('/')}
      />
    );
  }

  // Vista de participantes por defecto (ruta "/")
  return (
    <ParticipantView
      notes={notes}
      onGoToPanel={() => navigateTo('/panel')}
    />
  );
}
