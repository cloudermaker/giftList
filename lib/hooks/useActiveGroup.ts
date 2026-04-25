/**
 * useActiveGroup Hook
 * Gère le groupe actuellement actif pour un user dans le contexte multi-groupes
 */

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const ACTIVE_GROUP_COOKIE = 'activeGroupId';

export interface ActiveGroupState {
  activeGroupId: string | null;
  setActiveGroup: (groupId: string) => void;
  clearActiveGroup: () => void;
}

/**
 * Hook pour gérer le groupe actif
 * Stocke l'information dans un cookie pour persistance
 */
export function useActiveGroup(userId?: string): ActiveGroupState {
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);

  useEffect(() => {
    // Charger depuis le cookie au montage
    const savedGroupId = Cookies.get(ACTIVE_GROUP_COOKIE);
    if (savedGroupId) {
      setActiveGroupIdState(savedGroupId);
    }
  }, []);

  const setActiveGroup = (groupId: string) => {
    setActiveGroupIdState(groupId);
    Cookies.set(ACTIVE_GROUP_COOKIE, groupId, { expires: 365 });
  };

  const clearActiveGroup = () => {
    setActiveGroupIdState(null);
    Cookies.remove(ACTIVE_GROUP_COOKIE);
  };

  return {
    activeGroupId,
    setActiveGroup,
    clearActiveGroup
  };
}

/**
 * Récupérer le groupe actif depuis le cookie (côté serveur aussi)
 */
export function getActiveGroupFromCookie(): string | null {
  if (typeof window === 'undefined') {
    return null; // SSR
  }
  return Cookies.get(ACTIVE_GROUP_COOKIE) || null;
}

/**
 * Sauvegarder le groupe actif dans le cookie
 */
export function saveActiveGroupToCookie(groupId: string) {
  Cookies.set(ACTIVE_GROUP_COOKIE, groupId, { expires: 365 });
}
