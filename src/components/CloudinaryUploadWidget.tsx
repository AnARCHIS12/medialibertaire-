import { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';
import { Camera } from 'lucide-react';

const CLOUDINARY_CONFIG = {
  cloudName: 'debynh32n',
  uploadPreset: 'system_uploader_1e2ddab171f769b9_c9e13c63400923b8ec432a25b16c6f8190',
  folder: 'avatars'
};

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface CloudinaryUploadWidgetProps {
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function CloudinaryUploadWidget({ onSuccess, onError }: CloudinaryUploadWidgetProps) {
  const { user } = useAuth();
  const cloudinaryRef = useRef<any>();
  const widgetRef = useRef<any>();

  useEffect(() => {
    if (!user) return;

    // Add the Cloudinary script if it hasn't been added yet
    if (!document.getElementById('cloudinaryScript')) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.id = 'cloudinaryScript';
      document.body.appendChild(script);
    }

    // Initialize the widget when the script is loaded
    const initWidget = () => {
      if (typeof window.cloudinary !== 'undefined') {
        cloudinaryRef.current = window.cloudinary;
        widgetRef.current = cloudinaryRef.current.createUploadWidget(
          {
            cloudName: CLOUDINARY_CONFIG.cloudName,
            uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
            folder: CLOUDINARY_CONFIG.folder,
            sources: ['local', 'camera'],
            maxFileSize: 5000000, // 5MB
            cropping: true,
            croppingAspectRatio: 1,
            croppingDefaultSelectionRatio: 0.8,
            resourceType: 'image',
            maxImageWidth: 400,
            maxImageHeight: 400,
            multiple: false,
            defaultSource: 'local',
            styles: {
              palette: {
                window: '#FFFFFF',
                windowBorder: '#90A0B3',
                tabIcon: '#EF4444',
                menuIcons: '#5A616A',
                textDark: '#000000',
                textLight: '#FFFFFF',
                link: '#EF4444',
                action: '#EF4444',
                inactiveTabIcon: '#0E2F5A',
                error: '#F44235',
                inProgress: '#EF4444',
                complete: '#20B832',
                sourceBg: '#E4EBF1'
              }
            }
          },
          async (error: any, result: any) => {
            if (error) {
              console.error('Erreur Widget Cloudinary:', error);
              onError?.(new Error(error.message || 'Erreur lors de l\'upload'));
              return;
            }

            console.log('Résultat Cloudinary:', result);

            if (result.event === 'success') {
              try {
                const photoURL = result.info.secure_url;
                console.log('URL de la photo:', photoURL);

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

                onSuccess?.(photoURL);
                toast.success('Photo de profil mise à jour !');
              } catch (error) {
                console.error('Erreur mise à jour profil:', error);
                onError?.(new Error('Erreur lors de la mise à jour du profil'));
              }
            }
          }
        );
      }
    };

    // Check if the script is already loaded
    if (typeof window.cloudinary !== 'undefined') {
      initWidget();
    } else {
      document.getElementById('cloudinaryScript')?.addEventListener('load', initWidget);
    }

    return () => {
      document.getElementById('cloudinaryScript')?.removeEventListener('load', initWidget);
    };
  }, [user, onSuccess, onError]);

  const handleClick = () => {
    if (!user) {
      toast.error('Vous devez être connecté pour changer votre avatar');
      return;
    }
    widgetRef.current?.open();
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      <Camera className="w-5 h-5 mr-2" />
      Changer la photo de profil
    </button>
  );
}
