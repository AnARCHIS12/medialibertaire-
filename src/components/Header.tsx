import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, PenSquare, LogIn, Home, Newspaper, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from './AuthModal';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, signOut } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="bg-black text-white">
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
                      className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                    >
                      <img
                        src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || 'Anonyme'}`}
                        alt={user.displayName || 'Anonyme'}
                        className="w-8 h-8 rounded-full"
                      />
                      <span>{user.displayName || 'Anonyme'}</span>
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg py-1">
                        <Link
                          to={`/profile/${user.uid}`}
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User size={18} />
                          <span>Mon profil</span>
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings size={18} />
                          <span>Paramètres</span>
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                        >
                          <LogOut size={18} />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    )}
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
              className="md:hidden text-white"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <Link 
                to="/" 
                className="flex items-center space-x-2 hover:text-red-500 transition-colors px-4"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home size={18} />
                <span>Accueil</span>
              </Link>
              <Link 
                to="/articles" 
                className="flex items-center space-x-2 hover:text-red-500 transition-colors px-4"
                onClick={() => setIsMenuOpen(false)}
              >
                <Newspaper size={18} />
                <span>Articles</span>
              </Link>
              {user ? (
                <>
                  <Link 
                    to="/write" 
                    className="flex items-center space-x-2 hover:text-red-500 transition-colors px-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <PenSquare size={18} />
                    <span>Écrire</span>
                  </Link>
                  <Link 
                    to={`/profile/${user.uid}`}
                    className="flex items-center space-x-2 hover:text-red-500 transition-colors px-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={18} />
                    <span>Mon profil</span>
                  </Link>
                  <Link 
                    to="/settings"
                    className="flex items-center space-x-2 hover:text-red-500 transition-colors px-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings size={18} />
                    <span>Paramètres</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 hover:text-red-500 transition-colors px-4 w-full"
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
                  className="flex items-center space-x-2 hover:text-red-500 transition-colors px-4"
                >
                  <LogIn size={18} />
                  <span>Connexion</span>
                </button>
              )}
            </div>
          )}
        </nav>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};