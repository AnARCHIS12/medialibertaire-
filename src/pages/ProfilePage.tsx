import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Settings, Edit2 } from 'lucide-react';
import { ArticleCard } from '../components/ArticleCard';
import { convertFirestoreArticle } from '../utils/firestore';
import type { Article } from '../types';

interface UserProfile {
  id: string;
  displayName: string;
  bio?: string;
  joinedAt: Date;
  articlesCount: number;
  commentsCount: number;
}

export const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState<'articles' | 'comments' | 'bookmarks'>('articles');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (id: string, value: number) => {
    if (!user) {
      alert('Vous devez être connecté pour voter');
      return;
    }

    try {
      const articleRef = doc(db, 'articles', id);
      await updateDoc(articleRef, {
        votes: increment(value)
      });

      setArticles(prevArticles =>
        prevArticles.map(article =>
          article.id === id
            ? { ...article, votes: article.votes + value }
            : article
        )
      );
    } catch (error) {
      console.error('Error voting:', error);
      alert('Une erreur est survenue lors du vote');
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) {
        console.error('ID de profil manquant');
        setError("ID de profil non spécifié");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      console.log('Tentative de chargement du profil:', id);

      try {
        const userRef = doc(db, 'users', id);
        console.log('Récupération du document utilisateur...');
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.error('Document utilisateur non trouvé dans Firestore');
          setError("Le profil demandé n'existe pas dans la base de données");
          setLoading(false);
          return;
        }

        console.log('Document utilisateur trouvé:', userSnap.data());
        const userData = userSnap.data();
        
        if (!userData.displayName) {
          console.warn('Le profil existe mais displayName est manquant');
        }

        setProfile({
          id: userSnap.id,
          displayName: userData.displayName || 'Utilisateur sans nom',
          bio: userData.bio || '',
          joinedAt: userData.joinedAt instanceof Timestamp ? userData.joinedAt.toDate() : new Date(),
          articlesCount: userData.articlesCount || 0,
          commentsCount: userData.commentsCount || 0
        });

        console.log('Récupération des articles de l\'utilisateur...');
        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, where('authorId', '==', id));
        const snapshot = await getDocs(q);
        const articlesData = snapshot.docs.map(doc => convertFirestoreArticle(doc));
        console.log(`${articlesData.length} articles trouvés`);
        setArticles(articlesData);
      } catch (error) {
        console.error('Erreur détaillée lors du chargement du profil:', error);
        if (error instanceof Error) {
          setError(`Erreur: ${error.message}`);
        } else {
          setError("Une erreur inattendue est survenue lors du chargement du profil");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Profil non trouvé</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Profil non trouvé
          </h1>
          <p className="text-gray-600">
            Le profil que vous recherchez n'existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.displayName}
              </h1>
              {profile.bio && (
                <p className="text-gray-600 mb-4">{profile.bio}</p>
              )}
              <p className="text-sm text-gray-500">
                Membre depuis {format(profile.joinedAt, "MMMM yyyy", { locale: fr })}
              </p>
            </div>
            {user?.uid === id && (
              <button
                className="flex items-center text-gray-600 hover:text-red-600"
                onClick={() => window.location.href = '/settings'}
              >
                <Settings className="w-5 h-5 mr-1" />
                Paramètres
              </button>
            )}
          </div>

          <div className="flex space-x-4 border-b border-gray-200">
            <button
              className={`px-4 py-2 ${
                activeTab === 'articles'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600'
              }`}
              onClick={() => setActiveTab('articles')}
            >
              <span className="flex items-center">
                <Edit2 className="w-4 h-4 mr-2" />
                Articles ({articles.length})
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'articles' && articles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              onVote={handleVote}
              showAuthor={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
