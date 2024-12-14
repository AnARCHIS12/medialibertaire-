import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

export const WritePage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', `${CLOUDINARY_CONFIG.folder}/articles`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload de l\'image');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setError('Erreur lors de l\'upload de l\'image');
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Validation de base
      if (!title.trim() || !content.trim()) {
        throw new Error('Le titre et le contenu sont requis');
      }

      // Préparation des données de l'article
      const articleData = {
        id: `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim(),
        content: content.trim(),
        authorId: user?.uid || 'anonymous',
        authorName: user?.displayName || 'Anonyme',
        createdAt: new Date(),
        updatedAt: new Date(),
        votes: 0,
        tags: [],
        isHidden: false
      };

      console.log('Tentative de publication...', articleData);

      // Ajout du document
      const articlesRef = collection(db, 'articles');
      await addDoc(articlesRef, articleData);
      
      console.log('Article publié avec succès');
      
      // Réinitialisation du formulaire
      setTitle('');
      setContent('');
      setError(null);
      
      // Redirection vers la page des articles
      navigate('/articles');
    } catch (err) {
      console.error('Erreur détaillée:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('permission-denied')) {
          setError('Erreur de permissions. Veuillez vous reconnecter.');
        } else {
          setError(`Erreur: ${err.message}`);
        }
      } else {
        setError('Une erreur inattendue est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (imageUrl: string) => {
    setImages(prev => prev.filter(url => url !== imageUrl));
    setContent(prev => prev.replace(`![](${imageUrl})\n`, ''));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      console.log('No file selected');
      return;
    }

    if (!user) {
      setError('Vous devez être connecté pour télécharger des images');
      return;
    }

    const file = e.target.files[0];
    console.log('File selected:', file.name, file.type, file.size);

    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const imageUrl = await handleImageUpload(file);
      setImages(prev => [...prev, imageUrl]);
      setContent(prev => prev + `\n![${file.name}](${imageUrl})\n`);

      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      console.log('Upload process completed successfully');
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Écrire un article</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Titre
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Le titre de votre article"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Images
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={`
                    flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md
                    ${uploading 
                      ? 'bg-gray-100 cursor-not-allowed' 
                      : 'hover:bg-gray-50 focus:ring-2 focus:ring-red-500'}
                  `}
                >
                  <ImageIcon size={18} />
                  <span>{uploading ? 'Téléchargement...' : 'Ajouter une image'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Image ${index + 1}`}
                        className="w-full h-40 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(imageUrl)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Contenu
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Le contenu de votre article..."
                required
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="anarchisme, écologie, autogestion..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || uploading}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};