import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { Camera, Loader2, User } from 'lucide-react';
import { CloudinaryUploadWidget } from '../components/CloudinaryUploadWidget';

export default function SettingsPage() {
  const { user, updateEmail, updatePassword, updateDisplayName } = useAuth();
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingDisplayName, setIsUpdatingDisplayName] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');

  if (!user) {
    return <div>Chargement...</div>;
  }

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setIsUpdatingEmail(true);
    try {
      await updateEmail(newEmail);
      setNewEmail('');
      toast.success('Email mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !currentPassword) return;

    setIsUpdatingPassword(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setCurrentPassword('');
      toast.success('Mot de passe mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du mot de passe');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDisplayNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName) return;

    setIsUpdatingDisplayName(true);
    try {
      await updateDisplayName(newDisplayName);
      setNewDisplayName('');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du nom');
    } finally {
      setIsUpdatingDisplayName(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Paramètres du compte</h1>

        <div className="bg-white shadow rounded-lg p-6 space-y-8">
          {/* Section Profile */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            
            {/* Section Avatar */}
            <div className="flex flex-col items-center space-y-4 pb-8 border-b border-gray-200">
              <div className="relative group">
                <div className="relative rounded-full overflow-hidden">
                  <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`}
                    alt="Photo de profil"
                    className="w-32 h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              
              <CloudinaryUploadWidget 
                onError={(error) => toast.error(error.message)} 
              />
            </div>

            {/* Section Nom d'affichage */}
            <form onSubmit={handleDisplayNameUpdate} className="space-y-4 mt-8">
              <h3 className="text-lg font-medium">Changer le nom d'affichage</h3>
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Nom actuel
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    disabled
                    value={user.displayName || ''}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none bg-gray-50 border border-gray-300 text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="newDisplayName" className="block text-sm font-medium text-gray-700">
                  Nouveau nom
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    id="newDisplayName"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="Nouveau nom d'affichage"
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border focus:ring-red-500 focus:border-red-500 border-gray-300"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isUpdatingDisplayName || !newDisplayName}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isUpdatingDisplayName ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Mise à jour...
                  </>
                ) : (
                  'Mettre à jour le nom'
                )}
              </button>
            </form>

            {/* Section Email */}
            <form onSubmit={handleEmailUpdate} className="space-y-4 mt-8">
              <h3 className="text-lg font-medium">Changer l'email</h3>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Nouvel email
                </label>
                <input
                  type="email"
                  id="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="nouveau@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={isUpdatingEmail || !newEmail}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isUpdatingEmail ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Mise à jour...
                  </>
                ) : (
                  'Mettre à jour l\'email'
                )}
              </button>
            </form>

            {/* Section Mot de passe */}
            <form onSubmit={handlePasswordUpdate} className="space-y-4 mt-8">
              <h3 className="text-lg font-medium">Changer le mot de passe</h3>
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <button
                type="submit"
                disabled={isUpdatingPassword || !newPassword || !currentPassword}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Mise à jour...
                  </>
                ) : (
                  'Mettre à jour le mot de passe'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
