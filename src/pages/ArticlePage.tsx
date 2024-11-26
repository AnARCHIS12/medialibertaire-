import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Comments } from '../components/Comments';
import type { Article } from '../types';

export const ArticlePage = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;

      try {
        const articleRef = doc(db, 'articles', id);
        const articleSnap = await getDoc(articleRef);
        
        if (articleSnap.exists()) {
          setArticle({
            id: articleSnap.id,
            ...articleSnap.data()
          } as Article);
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Article non trouvé
          </h1>
          <p className="text-gray-600">
            L'article que vous recherchez n'existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <article className="max-w-4xl mx-auto px-4">
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg mb-8"
          />
        )}

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>

        <div className="flex items-center space-x-4 text-gray-600 mb-8">
          <div className="flex items-center space-x-2">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${article.authorName}`}
              alt={article.authorName}
              className="w-8 h-8 rounded-full"
            />
            <span>{article.authorName}</span>
          </div>
          <span>•</span>
          <time>
            {format(new Date(article.createdAt), "d MMMM yyyy", { locale: fr })}
          </time>
        </div>

        <div className="prose prose-lg max-w-none mb-8">
          {article.content}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {article.tags.map(tag => (
            <a
              key={tag}
              href={`/tag/${tag}`}
              className="text-sm bg-gray-100 px-3 py-1 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
            >
              #{tag}
            </a>
          ))}
        </div>

        <Comments articleId={article.id} />
      </article>
    </div>
  );
};
