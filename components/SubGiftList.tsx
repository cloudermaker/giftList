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
  initialCount?: number;
  onGiftUpdate?: () => void;
}

export default function SubGiftList({ 
  parentGift, 
  userId, 
  isAdmin = false,
  initialCount,
  onGiftUpdate 
}: SubGiftListProps) {
  const [subGifts, setSubGifts] = useState<GiftWithTakenUserId[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [creatingSubGift, setCreatingSubGift] = useState(false);
  const [newSubGiftName, setNewSubGiftName] = useState('');

  const isOwner = parentGift.userId === userId;

  // Charger les sous-cadeaux quand le composant est expanded
  useEffect(() => {
    if (expanded && parentGift.giftType === 'MULTIPLE') {
      loadSubGifts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        name: newSubGiftName
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

  const handleDeleteSubGift = async (subGift: GiftWithTakenUserId) => {
    const result = await Swal.fire({
      title: 'Supprimer ce sous-cadeau ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`/api/gift/${subGift.id}`);
      setSubGifts((prev) => prev.filter((g) => g.id !== subGift.id));
      if (onGiftUpdate) onGiftUpdate();
    } catch (error) {
      Swal.fire({ title: 'Erreur', text: `Erreur lors de la suppression: ${error}`, icon: 'error' });
    }
  };

  const handleTakeSubGift = async (subGift: GiftWithTakenUserId) => {
    try {
      const isTaken = subGift.takenUserId != null;
      const endpoint = `/api/gift/${subGift.id}/take`;
      
      if (isTaken) {
        await axios.delete(endpoint, { data: { userId } });
      } else {
        await axios.post(endpoint, { userId });
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
    <div>
      {/* Toggle pour expand/collapse */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 px-4 py-2.5 mb-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 cursor-pointer select-none transition-colors duration-150"
      >
        <span className={`text-indigo-500 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
        <span className="text-sm font-medium text-indigo-700 flex-1">
          {expanded ? 'Masquer' : 'Afficher'} les sous-cadeaux
        </span>
        {(subGifts.length > 0 || (initialCount ?? 0) > 0) && (
          <span className="text-xs bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
            {subGifts.length || initialCount}
          </span>
        )}
      </div>

      {expanded && (
        <div className="space-y-2">
          {loading && (
            <>
              {Array.from({ length: subGifts.length || initialCount || 1 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-8 bg-gray-200 rounded-lg w-24" />
                </div>
              ))}
            </>
          )}

          {!loading && subGifts.length === 0 && (
            <div className="text-sm text-gray-500 italic">
              Aucun sous-cadeau pour le moment
            </div>
          )}

          {/* Liste des sous-cadeaux */}
          {!loading && subGifts.map((subGift) => {
            const isTaken = subGift.takenUserId != null;
            const takenByMe = subGift.takenUserId === userId;

            return (
            <div
              key={subGift.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isOwner ? 'bg-white border-gray-200' : isTaken ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex-1 flex items-center gap-2">
                <div>
                  <span className={`text-sm ${isTaken ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {subGift.name}
                  </span>
                  {!isOwner && (
                    <span className={`ml-2 text-xs font-medium ${isTaken ? 'text-red-500' : 'text-green-600'}`}>
                      {isTaken ? (takenByMe ? 'Réservé par vous' : 'Déjà réservé') : 'Disponible'}
                    </span>
                  )}
                </div>
              </div>

              {/* Boutons selon le rôle */}
              {isOwner ? (
                <CustomButton onClick={() => handleDeleteSubGift(subGift)}>
                  Supprimer
                </CustomButton>
              ) : isTaken && takenByMe ? (
                <CustomButton onClick={() => handleTakeSubGift(subGift)}>
                  Je ne prends plus
                </CustomButton>
              ) : !isTaken ? (
                <CustomButton onClick={() => handleTakeSubGift(subGift)} className="green-button">
                  Je le prends
                </CustomButton>
              ) : null}
            </div>
            );
          })}

          {/* Formulaire d'ajout de sous-cadeau */}
          {(isAdmin || isOwner) && (
            <div className="mt-3">
              {!creatingSubGift ? (
                <CustomButton
                  onClick={() => setCreatingSubGift(true)}
                  className="green-button"
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
                    className="green-button"
                  >
                    Ajouter
                  </CustomButton>
                  <CustomButton
                    onClick={() => {
                      setCreatingSubGift(false);
                      setNewSubGiftName('');
                    }}
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
