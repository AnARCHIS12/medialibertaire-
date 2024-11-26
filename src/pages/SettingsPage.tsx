import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  updateProfile, 
  updateEmail, 
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, User, Lock } from 'lucide-react';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState('');
  
  // Security states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Attendre que l'état d'authentification soit chargé
    if (authLoading) return;

    // Rediriger si non connecté
    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charge les données du profil
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBio(userData.bio || '');
          setDisplayName(user.displayName || '');
          setEmail(user.email || '');
        } else {
          // Créer le document utilisateur s'il n'existe pas
          await setDoc(userDocRef, {
            displayName: user.displayName || '',
            email: user.email || '',
            bio: '',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate, authLoading]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Mise à jour du profil Firebase Auth
      await updateProfile(user, {
        displayName: displayName.trim()
      });

      // Mise à jour de l'email si changé
      if (email.trim() !== user.email) {
        await updateEmail(user, email.trim());
      }

      // Mise à jour du profil Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        displayName: displayName.trim(),
        email: email.trim(),
        bio: bio.trim(),
        updatedAt: new Date()
      }, { merge: true });

      setSuccess('Profil mis à jour avec succès');
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err instanceof Error) {
        switch (err.name) {
          case 'auth/requires-recent-login':
            setError('Pour des raisons de sécurité, veuillez vous reconnecter avant de modifier votre email');
            break;
          case 'auth/email-already-in-use':
            setError('Cette adresse email est déjà utilisée par un autre compte');
            break;
          case 'auth/invalid-email':
            setError('L\'adresse email n\'est pas valide');
            break;
          default:
            setError('Une erreur est survenue lors de la mise à jour du profil');
        }
      } else {
        setError('Une erreur est survenue lors de la mise à jour du profil');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (newPassword !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }

      if (newPassword.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      // Réauthentification
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Mise à jour du mot de passe
      await updatePassword(user, newPassword);

      setSuccess('Mot de passe mis à jour avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error updating password:', err);
      if (err instanceof Error) {
        switch (err.name) {
          case 'auth/wrong-password':
            setError('Le mot de passe actuel est incorrect');
            break;
          case 'auth/weak-password':
            setError('Le nouveau mot de passe est trop faible');
            break;
          case 'auth/requires-recent-login':
            setError('Pour des raisons de sécurité, veuillez vous reconnecter avant de modifier votre mot de passe');
            break;
          default:
            setError('Une erreur est survenue lors de la mise à jour du mot de passe');
        }
      } else {
        setError('Une erreur est survenue lors de la mise à jour du mot de passe');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Paramètres</h1>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 font-medium ${
                activeTab === 'profile'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <User size={18} />
              <span>Profil</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2 font-medium ${
                activeTab === 'security'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <Lock size={18} />
              <span>Sécurité</span>
            </button>
          </div>

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom d'affichage
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
              </button>
            </form>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
