import { Timestamp, DocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { Article } from '../types';

export const convertFirestoreArticle = (doc: DocumentSnapshot<DocumentData>): Article => {
  const data = doc.data();
  if (!data) {
    throw new Error('Document data is undefined');
  }
  
  return {
    id: doc.id,
    title: data.title,
    content: data.content,
    authorId: data.authorId,
    authorName: data.authorName,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    votes: data.votes || 0,
    tags: data.tags || [],
    imageUrl: data.imageUrl
  };
};
