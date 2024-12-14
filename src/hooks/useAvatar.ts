import { useState } from 'react';
import { useAuth } from './useAuth';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';

const CLOUDINARY_CLOUD_NAME = 'debynh32n';

export function useAvatar() {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);

  const updateAvatar = async (file: File) => {
    if (!user) {
      toast.error('Vous devez être connecté pour changer votre avatar');
      return;
    }

    try {
      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Le fichier doit être une image');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }

      setUploadProgress(20);

      // Créer le FormData pour Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');
      formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
      formData.append('folder', 'medialiber/avatars');

      setUploadProgress(40);

      // Upload vers Cloudinary
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: formData
      });

      setUploadProgress(60);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur Cloudinary:', errorData);
        throw new Error(errorData.error?.message || 'Erreur lors de l\'upload vers Cloudinary');
      }

      const data = await response.json();
      console.log('Réponse Cloudinary:', data);
      const photoURL = data.secure_url;

      setUploadProgress(80);

      try {
        // Mise à jour du profil Firebase
        await updateProfile(user, { photoURL });
        console.log('Profil Firebase mis à jour');

        // Mise à jour du profil Firestore
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { 
          photoURL,
          updatedAt: new Date()
        });
        console.log('Profil Firestore mis à jour');

        setUploadProgress(100);
        toast.success('Photo de profil mise à jour !');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        throw new Error('Erreur lors de la mise à jour du profil');
      }

      // Reset progress après 1 seconde
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error('Erreur complète:', error);
      setUploadProgress(0);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors de la mise à jour de la photo de profil');
      }
    }
  };

  return {
    avatarUrl: user?.photoURL,
    uploadProgress,
    updateAvatar
  };
}
