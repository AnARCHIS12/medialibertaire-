import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  type User
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Mise à jour du profil avec le nom d'affichage
      await firebaseUpdateProfile(user, { displayName });

      // Création du document utilisateur dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName,
        createdAt: new Date(),
      });

      toast.success('Compte créé avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Connexion réussie !');
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Création/mise à jour du document utilisateur dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: new Date(),
      }, { merge: true });

      toast.success('Connexion avec Google réussie !');
    } catch (error) {
      console.error('Erreur lors de la connexion avec Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Déconnexion réussie !');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  };

  const updateEmail = async (newEmail: string) => {
    if (!user) throw new Error('Utilisateur non connecté');
    try {
      await firebaseUpdateEmail(user, newEmail);
      toast.success('Email mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'email:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) throw new Error('Utilisateur non connecté');
    try {
      await firebaseUpdatePassword(user, newPassword);
      toast.success('Mot de passe mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      throw error;
    }
  };

  const updateDisplayName = async (newDisplayName: string) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      // Mise à jour du profil Firebase
      await firebaseUpdateProfile(user, { displayName: newDisplayName });

      // Mise à jour du document Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: newDisplayName,
        updatedAt: new Date()
      });

      toast.success('Nom de profil mis à jour !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nom:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updateEmail,
    updatePassword,
    updateDisplayName,
  };
};