/**
 * SubGiftList Component
 * Affiche un cadeau parent avec ses sous-cadeaux (enfants)
 * Exemple: Manga "Naruto" avec les tomes individuels
 */

import { Gift, GiftType } from '@prisma/client';
import { GiftWithTakenUserId } from '@/lib/db/giftManager';
import { useState, useEffect } from 'react';
import axios from 'axios';
import CustomButton from './atoms/customButton';
import Swal from 'sweetalert2';

interface SubGiftListProps {
  parentGift: GiftWithTakenUserId;
  userId?: string;
  isAdmin?: boolean;
  onGiftUpdate?: () => void;
}

export default function SubGiftList({ 
  parentGift, 
  userId, 
  isAdmin = false,
  onGiftUpdate 
}: SubGiftListProps) {
  const [subGifts, setSubGifts] = useState<GiftWithTakenUserId[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [creatingSubGift, setCreatingSubGift] = useState(false);
  const [newSubGiftName, setNewSubGiftName] = useState('');

  // Charger les sous-cadeaux quand le composant est expanded
  useEffect(() => {
    if (expanded && parentGift.giftType === 'MULTIPLE') {
      loadSubGifts();
    }
  }, [expanded, parentGift.id]);

  const loadSubGifts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/gift/${parentGift.id}/subgifts`);
      if (response.data.success) {
        setSubGifts(response.data.subGifts || []);
      }
    } catch (error) {
      console.error('Error loading subgifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubGift = async () => {
    if (!newSubGiftName.trim()) {
      Swal.fire({
        title: 'Erreur',
        text: 'Le nom du sous-cadeau ne peut pas être vide',
        icon: 'error'
      });
      return;
    }

    try {
      const response = await axios.post(`/api/gift/${parentGift.id}/subgifts`, {
        subGift: {
          name: newSubGiftName,
          userId: parentGift.userId,
          giftType: 'SIMPLE' as GiftType
        }
      });

      if (response.data.success && response.data.subGift) {
        setSubGifts([...subGifts, response.data.subGift]);
        setNewSubGiftName('');
        setCreatingSubGift(false);
        
        if (onGiftUpdate) {
          onGiftUpdate();
        }
        
        Swal.fire({
          title: 'Succès',
          text: 'Sous-cadeau ajouté !',
          icon: 'success',
          timer: 2000
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Erreur',
        text: `Erreur lors de la création: ${error}`,
        icon: 'error'
      });
    }
  };

  const handleTakeSubGift = async (subGift: GiftWithTakenUserId) => {
    try {
      const isTaken = subGift.takenUserId != null;
      const endpoint = `/api/gift/${subGift.id}/take`;
      
      if (isTaken) {
        await axios.delete(endpoint);
      } else {
        await axios.post(endpoint);
      }

      // Recharger les sous-cadeaux
      await loadSubGifts();
      
      if (onGiftUpdate) {
        onGiftUpdate();
      }
    } catch (error) {
      Swal.fire({
        title: 'Erreur',
        text: `Erreur lors de la réservation: ${error}`,
        icon: 'error'
      });
    }
  };

  // Si ce n'est pas un cadeau MULTIPLE, ne rien afficher
  if (parentGift.giftType !== 'MULTIPLE') {
    return null;
  }

  return (
    <div className="mt-3 ml-6 border-l-2 border-gray-200 pl-4">
      {/* Toggle pour expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-2"
      >
        <span className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
        <span>
          {expanded ? 'Masquer' : 'Afficher'} les sous-cadeaux
          {subGifts.length > 0 && ` (${subGifts.length})`}
        </span>
      </button>

      {expanded && (
        <div className="space-y-2">
          {loading && (
            <div className="text-sm text-gray-500 italic">Chargement...</div>
          )}

          {!loading && subGifts.length === 0 && (
            <div className="text-sm text-gray-500 italic">
              Aucun sous-cadeau pour le moment
            </div>
          )}

          {/* Liste des sous-cadeaux */}
          {!loading && subGifts.map((subGift) => (
            <div
              key={subGift.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                subGift.takenUserId ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex-1">
                <span className={`text-sm ${subGift.takenUserId ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {subGift.name}
                </span>
                {subGift.takenUserId && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Réservé)
                  </span>
                )}
              </div>

              {/* Bouton de réservation/libération */}
              {(isAdmin || subGift.takenUserId === userId) && (
                <CustomButton
                  onClick={() => handleTakeSubGift(subGift)}
                  className={`text-xs px-3 py-1 ${
                    subGift.takenUserId
                      ? 'bg-red-100 hover:bg-red-200 text-red-700'
                      : 'bg-green-100 hover:bg-green-200 text-green-700'
                  }`}
                >
                  {subGift.takenUserId ? 'Libérer' : 'Réserver'}
                </CustomButton>
              )}
            </div>
          ))}

          {/* Formulaire d'ajout de sous-cadeau */}
          {isAdmin && (
            <div className="mt-3">
              {!creatingSubGift ? (
                <CustomButton
                  onClick={() => setCreatingSubGift(true)}
                  className="text-sm px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700"
                >
                  + Ajouter un sous-cadeau
                </CustomButton>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubGiftName}
                    onChange={(e) => setNewSubGiftName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateSubGift()}
                    placeholder="Nom du sous-cadeau (ex: Tome 1)"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                    autoFocus
                  />
                  <CustomButton
                    onClick={handleCreateSubGift}
                    className="text-sm px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700"
                  >
                    Ajouter
                  </CustomButton>
                  <CustomButton
                    onClick={() => {
                      setCreatingSubGift(false);
                      setNewSubGiftName('');
                    }}
                    className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    Annuler
                  </CustomButton>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
