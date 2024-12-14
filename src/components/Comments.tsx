import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  articleId: string;
}

interface CommentsProps {
  articleId: string;
}

export const Comments = ({ articleId }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const commentsRef = collection(db, 'comments');
        const q = query(
          commentsRef,
          where('articleId', '==', articleId),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        })) as Comment[];
        setComments(commentsData);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const commentRef = await addDoc(collection(db, 'comments'), {
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonyme',
        createdAt: serverTimestamp(),
        articleId
      });

      // Optimistic update
      const newCommentObj = {
        id: commentRef.id,
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonyme',
        createdAt: new Date(),
        articleId
      };

      setComments(prev => [newCommentObj, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Une erreur est survenue lors de l\'ajout du commentaire');
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <MessageCircle className="mr-2" />
        Commentaires ({comments.length})
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows={3}
            required
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Commenter
          </button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg text-center">
          <p>Connectez-vous pour commenter</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.authorName}`}
                  alt={comment.authorName}
                  className="w-6 h-6 rounded-full"
                />
                <span>{comment.authorName}</span>
                <span>•</span>
                <time>
                  {format(comment.createdAt, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </time>
              </div>
              <p className="text-gray-800">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
