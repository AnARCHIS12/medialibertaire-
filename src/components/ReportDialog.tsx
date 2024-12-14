import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, X } from 'lucide-react';

interface ReportDialogProps {
  contentId: string;
  contentType: 'article' | 'comment';
  isOpen: boolean;
  onClose: () => void;
}

export const ReportDialog = ({ contentId, contentType, isOpen, onClose }: ReportDialogProps) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Vous devez être connecté pour signaler du contenu');
      return;
    }

    if (!reason.trim()) {
      setError('Veuillez expliquer la raison du signalement');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reportData = {
        contentId,
        contentType,
        reporterId: user.uid,
        reporterName: user.displayName || 'Anonyme',
        reason: reason.trim(),
        createdAt: serverTimestamp(),
        status: 'pending',
        votes: {
          hide: [],
          keep: []
        }
      };

      await addDoc(collection(db, 'reports'), reportData);
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      setError('Une erreur est survenue lors du signalement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Signaler le contenu</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-600 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Raison du signalement
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              placeholder="Expliquez pourquoi ce contenu devrait être examiné par la communauté..."
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`
                px-4 py-2 bg-red-600 text-white rounded-md
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}
                transition-colors
              `}
            >
              {loading ? 'Envoi...' : 'Signaler'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
