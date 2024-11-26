import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Settings, Edit2, Bookmark, MessageSquare } from 'lucide-react';
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

      // Mise à jour locale de l'état
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
      if (!id) return;

      try {
        const userRef = doc(db, 'users', id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setProfile({
            id: userSnap.id,
            ...userSnap.data()
          } as UserProfile);

          // Fetch user's articles
          const articlesRef = collection(db, 'articles');
          const q = query(articlesRef, where('authorId', '==', id));
          const snapshot = await getDocs(q);
          const articlesData = snapshot.docs.map(doc => convertFirestoreArticle(doc));
          setArticles(articlesData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
            Le profil que vous recherchez n'existe pas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.displayName}`}
                alt={profile.displayName}
                className="w-20 h-20 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                <p className="text-gray-600">
                  Membre depuis {format(new Date(profile.joinedAt), "MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
            {user?.uid === id && (
              <button className="text-gray-600 hover:text-red-600 transition-colors">
                <Settings size={24} />
              </button>
            )}
          </div>

          {profile.bio && (
            <p className="text-gray-700 mb-6">{profile.bio}</p>
          )}

          <div className="flex space-x-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile.articlesCount}</div>
              <div className="text-sm text-gray-600">Articles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile.commentsCount}</div>
              <div className="text-sm text-gray-600">Commentaires</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('articles')}
              className={`py-4 px-1 border-b-2 font-medium ${
                activeTab === 'articles'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Edit2 className="inline-block mr-2" size={18} />
              Articles
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-4 px-1 border-b-2 font-medium ${
                activeTab === 'comments'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="inline-block mr-2" size={18} />
              Commentaires
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`py-4 px-1 border-b-2 font-medium ${
                activeTab === 'bookmarks'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bookmark className="inline-block mr-2" size={18} />
              Favoris
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'articles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                onVote={handleVote}
              />
            ))}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            {/* Comments will be loaded here */}
            <p className="text-center text-gray-600">Fonctionnalité à venir</p>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="space-y-4">
            {/* Bookmarks will be loaded here */}
            <p className="text-center text-gray-600">Fonctionnalité à venir</p>
          </div>
        )}
      </div>
    </div>
  );
};
