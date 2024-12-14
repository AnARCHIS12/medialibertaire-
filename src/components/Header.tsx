import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, PenSquare, LogIn, Home, Newspaper, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from './AuthModal';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, signOut } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCurrentPhotoURL(null);
      return;
    }

    setCurrentPhotoURL(user.photoURL);

    // Écouter les changements du profil utilisateur en temps réel
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setCurrentPhotoURL(userData.photoURL || null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="bg-black text-white relative z-50">
        <nav className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold tracking-tight">
              Média Libertaire
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className="flex items-center space-x-2 hover:text-red-500 transition-colors"
              >
                <Home size={18} />
                <span>Accueil</span>
              </Link>
              <Link 
                to="/articles" 
                className="flex items-center space-x-2 hover:text-red-500 transition-colors"
              >
                <Newspaper size={18} />
                <span>Articles</span>
              </Link>
              {user ? (
                <>
                  <Link 
                    to="/write" 
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition-colors"
                  >
                    <PenSquare size={18} />
                    <span>Écrire</span>
                  </Link>
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 hover:text-red-500 transition-colors focus:outline-none"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={currentPhotoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || 'Anonyme'}`}
                          alt={user.displayName || 'Anonyme'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || 'Anonyme'}`;
                          }}
                        />
                      </div>
                      <span className="max-w-[120px] truncate">{user.displayName || 'Anonyme'}</span>
                    </button>
                    <div 
                      className={`absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg py-1 transform transition-all duration-200 ${
                        isUserMenuOpen 
                          ? 'opacity-100 translate-y-0 visible' 
                          : 'opacity-0 -translate-y-2 invisible'
                      }`}
                    >
                      <Link
                        to={`/profile/${user.uid}`}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User size={18} />
                        <span>Mon profil</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings size={18} />
                        <span>Paramètres</span>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors w-full text-left"
                      >
                        <LogOut size={18} />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition-colors"
                >
                  <LogIn size={18} />
                  <span>Connexion</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Menu mobile */}
          <div
            className={`md:hidden transition-all duration-300 ${
              isMenuOpen
                ? 'max-h-screen opacity-100 visible'
                : 'max-h-0 opacity-0 invisible'
            }`}
          >
            <div className="pt-4 pb-3 space-y-3">
              <Link
                to="/"
                className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home size={18} />
                <span>Accueil</span>
              </Link>
              <Link
                to="/articles"
                className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Newspaper size={18} />
                <span>Articles</span>
              </Link>
              {user ? (
                <>
                  <Link
                    to="/write"
                    className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <PenSquare size={18} />
                    <span>Écrire</span>
                  </Link>
                  <Link
                    to={`/profile/${user.uid}`}
                    className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={18} />
                    <span>Mon profil</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings size={18} />
                    <span>Paramètres</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 hover:text-red-500 transition-colors w-full text-left"
                  >
                    <LogOut size={18} />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                >
                  <LogIn size={18} />
                  <span>Connexion</span>
                </button>
              )}
            </div>
          </div>
        </nav>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};