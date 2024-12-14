import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  QueryConstraint, 
  DocumentSnapshot,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Article } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { AlertCircle, Search, Loader } from 'lucide-react';

export const ArticlesPage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const ARTICLES_PER_PAGE = 12;
  const POPULAR_TAGS = ['anarchisme', 'écologie', 'autogestion', 'féminisme', 'anticapitalisme'];

  const fetchArticles = useCallback(async (loadMore = false) => {
    try {
      setLoading(true);
      setError(null);

      const articlesRef = collection(db, 'articles');
      const constraints: QueryConstraint[] = [
        orderBy(sortBy === 'recent' ? 'createdAt' : 'votes', 'desc'),
        limit(ARTICLES_PER_PAGE)
      ];

      if (selectedTag) {
        constraints.push(where('tags', 'array-contains', selectedTag));
      }

      if (loadMore && lastVisible) {
        constraints.push(startAfter(lastVisible));
      }

      const q = query(articlesRef, ...constraints);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setHasMore(false);
        if (!loadMore) {
          setArticles([]);
        }
        return;
      }

      const articlesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          tags: data.tags || [],
          votes: data.votes || 0
        } as Article;
      });

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setArticles(prev => loadMore ? [...prev, ...articlesData] : articlesData);
      setHasMore(snapshot.docs.length === ARTICLES_PER_PAGE);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Une erreur est survenue lors du chargement des articles');
    } finally {
      setLoading(false);
    }
  }, [selectedTag, sortBy, lastVisible]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const articlesRef = collection(db, 'articles');
      const constraints: QueryConstraint[] = [
        orderBy('title'),
        where('title', '>=', searchTerm.trim()),
        where('title', '<=', searchTerm.trim() + '\uf8ff'),
        limit(ARTICLES_PER_PAGE)
      ];

      const q = query(articlesRef, ...constraints);
      const snapshot = await getDocs(q);
      const articlesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Article));

      setArticles(articlesData);
      setHasMore(false);
    } catch (err) {
      console.error('Error searching articles:', err);
      setError('Une erreur est survenue lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    fetchArticles(true);
  };

  const handleVote = async (id: string, value: number) => {
    if (!user) {
      setError('Vous devez être connecté pour voter');
      return;
    }

    try {
      const articleRef = doc(db, 'articles', id);
      await updateDoc(articleRef, {
        votes: increment(value)
      });

      // Mise à jour locale de l'état
      setArticles(prev =>
        prev.map(article =>
          article.id === id
            ? { ...article, votes: article.votes + value }
            : article
        )
      );
    } catch (err) {
      console.error('Error voting:', err);
      setError('Une erreur est survenue lors du vote');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="text-red-600 mr-2" />
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-6">Articles</h1>

            {/* Search and Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un article..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                </div>
              </form>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="recent">Plus récents</option>
                <option value="popular">Plus populaires</option>
              </select>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {POPULAR_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTag === tag
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {loading && !articles.length ? (
            <div className="text-center py-12">
              <Loader className="animate-spin h-8 w-8 text-red-600 mx-auto" />
              <p className="mt-4 text-gray-600">Chargement des articles...</p>
            </div>
          ) : articles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onVote={handleVote}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader className="animate-spin h-5 w-5 mx-auto" />
                    ) : (
                      'Charger plus d\'articles'
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Aucun article trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
