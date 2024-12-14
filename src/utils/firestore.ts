import { doc, getDoc, setDoc, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Article } from '../types';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirestoreError extends Error {
  code?: string;
}

export const handleFirestoreError = (error: FirestoreError): Error => {
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        return new Error('Vous n\'avez pas les permissions nécessaires');
      case 'not-found':
        return new Error('Document non trouvé');
      default:
        return new Error(`Erreur Firestore: ${error.code}`);
    }
  }
  
  return new Error('Une erreur inattendue est survenue');
};

export const convertFirestoreArticle = (doc: DocumentData): Article => {
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

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    console.log('Getting user profile for uid:', uid);
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('No profile found for uid:', uid);
      return null;
    }

    const data = userDoc.data();
    console.log('Profile data:', data);

    return {
      uid: uid,
      email: data.email || null,
      displayName: data.displayName || 'Anonyme',
      photoURL: data.photoURL || null,
      bio: data.bio || '',
      isAnonymous: data.isAnonymous || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw handleFirestoreError(error as FirestoreError);
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    console.log('Updating user profile for uid:', uid, 'with data:', data);
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    const now = new Date();
    const updateData = {
      ...data,
      displayName: data.displayName || 'Anonyme',
      updatedAt: now
    };

    if (!userDoc.exists()) {
      console.log('Creating new profile for uid:', uid);
      await setDoc(userRef, {
        ...updateData,
        uid,
        createdAt: now,
        email: data.email || null,
        displayName: data.displayName || 'Anonyme',
        photoURL: data.photoURL || null,
        bio: data.bio || '',
        isAnonymous: data.isAnonymous || false
      });
    } else {
      console.log('Updating existing profile for uid:', uid);
      await updateDoc(userRef, updateData);
    }

    console.log('Profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw handleFirestoreError(error as FirestoreError);
  }
}
