/**
 * GroupSelector Component
 * Permet à un user de switcher entre ses différents groupes
 * Affiche un dropdown si le user appartient à plusieurs groupes
 */

import { useEffect, useState } from 'react';
import axios from 'axios';

interface Group {
  id: string;
  name: string;
  role?: 'MEMBER' | 'ADMIN';
  joinedAt?: Date;
}

interface GroupSelectorProps {
  userId: string;
  currentGroupId?: string;
  onGroupChange?: (groupId: string) => void;
  className?: string;
}

export default function GroupSelector({ 
  userId, 
  currentGroupId, 
  onGroupChange,
  className = '' 
}: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(currentGroupId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Récupérer les groupes du user
    axios.get(`/api/userGroup?userId=${userId}`)
      .then((response) => {
        const userGroups = response.data.groups || [];
        setGroups(userGroups);
        
        // Si pas de groupe sélectionné, prendre le premier
        if (!selectedGroupId && userGroups.length > 0) {
          setSelectedGroupId(userGroups[0].id);
          if (onGroupChange) {
            onGroupChange(userGroups[0].id);
          }
        }
        
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading groups:', error);
        setLoading(false);
      });
  }, [userId]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newGroupId = event.target.value;
    setSelectedGroupId(newGroupId);
    
    if (onGroupChange) {
      onGroupChange(newGroupId);
    }
    
    // Recharger la page pour mettre à jour le contexte
    // TODO: Améliorer avec un contexte React global
    window.location.reload();
  };

  if (loading) {
    return (
      <div className={`group-selector ${className}`}>
        <span className="text-gray-500">Chargement...</span>
      </div>
    );
  }

  // Si un seul groupe, pas besoin de selector
  if (groups.length <= 1) {
    return (
      <div className={`group-selector ${className}`}>
        {groups.length === 1 && (
          <span className="font-medium text-gray-700">
            {groups[0].name}
          </span>
        )}
      </div>
    );
  }

  // Plusieurs groupes: afficher un dropdown
  return (
    <div className={`group-selector ${className}`}>
      <label htmlFor="group-select" className="sr-only">
        Sélectionner un groupe
      </label>
      <select
        id="group-select"
        value={selectedGroupId || ''}
        onChange={handleChange}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
            {group.role === 'ADMIN' && ' (Admin)'}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Composant simplifié pour affichage inline
 */
export function InlineGroupSelector({
  userId,
  currentGroupId,
  onGroupChange
}: Omit<GroupSelectorProps, 'className'>) {
  return (
    <GroupSelector
      userId={userId}
      currentGroupId={currentGroupId}
      onGroupChange={onGroupChange}
      className="inline-block"
    />
  );
}
