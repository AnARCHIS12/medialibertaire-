import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ThumbsUp, ThumbsDown, MessageCircle, Flag } from 'lucide-react';
import { ReportDialog } from './ReportDialog';
import type { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onVote: (id: string, value: number) => void;
  showAuthor?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onVote, showAuthor = true }) => {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  return (
    <>
      <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {article.imageUrl && (
          <Link to={`/article/${article.id}`}>
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full h-48 object-cover"
            />
          </Link>
        )}
        <div className="p-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
            {showAuthor && (
              <Link to={`/profile/${article.authorId}`} className="flex items-center space-x-2 hover:text-red-600">
                <img 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${article.authorName}`}
                  alt={article.authorName}
                  className="w-6 h-6 rounded-full"
                />
                <span>{article.authorName}</span>
              </Link>
            )}
            <span>•</span>
            <time>
              {format(new Date(article.createdAt), "d MMMM yyyy", { locale: fr })}
            </time>
          </div>

          <h2 className="text-xl font-bold mb-3">
            <Link to={`/article/${article.id}`} className="hover:text-red-600 transition-colors">
              {article.title}
            </Link>
          </h2>

          <p className="text-gray-600 mb-4 line-clamp-3">
            {article.content.substring(0, 150)}...
          </p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onVote(article.id, 1)}
                className="flex items-center space-x-1 hover:text-red-600 transition-colors"
              >
                <ThumbsUp size={18} />
                <span>Pour</span>
              </button>
              <button
                onClick={() => onVote(article.id, -1)}
                className="flex items-center space-x-1 hover:text-red-600 transition-colors"
              >
                <ThumbsDown size={18} />
                <span>Contre</span>
              </button>
              <div className="text-gray-600">
                {article.votes > 0 ? '+' : ''}{article.votes}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to={`/article/${article.id}#comments`}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
              >
                <MessageCircle size={18} />
                <span>Commenter</span>
              </Link>
              <button
                onClick={() => setIsReportDialogOpen(true)}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
              >
                <Flag size={18} />
                <span>Signaler</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <Link
                key={tag}
                to={`/tag/${tag}`}
                className="text-xs bg-gray-100 px-2 py-1 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </article>

      <ReportDialog
        contentId={article.id}
        contentType="article"
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
      />
    </>
  );
};