import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Users, MessageSquare, PenSquare } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { ArticleCard } from '../components/ArticleCard';
import { convertFirestoreArticle } from '../utils/firestore';
import type { Article } from '../types';

export const HomePage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRecentArticles = async () => {
      try {
        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, orderBy('createdAt', 'desc'), limit(6));
        const snapshot = await getDocs(q);
        const articlesData = snapshot.docs.map(doc => convertFirestoreArticle(doc));
        setArticles(articlesData);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentArticles();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-black text-white py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-black opacity-90"></div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Le Média Libertaire
            </h1>
            <p className="text-xl mb-8">
              Une plateforme collaborative pour partager des idées, des analyses et des perspectives libertaires.
              Rejoignez notre communauté et participez à la construction d'un espace de réflexion libre et engagé.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/articles"
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Découvrir les articles
              </Link>
              <Link
                to="/write"
                className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Écrire un article
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Pourquoi rejoindre notre communauté ?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Newspaper className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Articles de qualité</h3>
              <p className="text-gray-600">
                Publiez et découvrez des articles approfondis sur des sujets variés : politique, économie, écologie, culture...
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Users className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Communauté engagée</h3>
              <p className="text-gray-600">
                Échangez avec des personnes partageant vos valeurs et participez à des discussions enrichissantes.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <MessageSquare className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Débats constructifs</h3>
              <p className="text-gray-600">
                Participez à des débats respectueux et constructifs autour des idées libertaires.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Articles Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Articles récents</h2>
            <Link
              to="/articles"
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Voir tous les articles →
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des articles...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onVote={handleVote}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Prêt à partager vos idées ?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Rejoignez notre communauté et commencez à partager vos réflexions, analyses et perspectives libertaires.
          </p>
          <Link
            to="/write"
            className="bg-red-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-red-700 transition-colors inline-flex items-center"
          >
            <PenSquare className="mr-2" />
            Commencer à écrire
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">500+</div>
              <div className="text-gray-600">Articles publiés</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">1000+</div>
              <div className="text-gray-600">Membres actifs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">5000+</div>
              <div className="text-gray-600">Commentaires</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
