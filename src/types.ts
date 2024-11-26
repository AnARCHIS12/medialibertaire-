export interface Article {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  votes: number;
  tags: string[];
  imageUrl?: string;
  reports?: Report[];
  isHidden?: boolean;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio?: string;
  articles?: string[];
  votes?: Record<string, number>;
  reputation?: number;
  isTrusted?: boolean;
}

export interface Report {
  id: string;
  contentId: string;  // ID de l'article ou du commentaire signalé
  contentType: 'article' | 'comment';
  reporterId: string;
  reporterName: string;
  reason: string;
  createdAt: Date;
  status: 'pending' | 'resolved' | 'rejected';
  votes: {
    hide: string[];    // IDs des utilisateurs qui votent pour cacher
    keep: string[];    // IDs des utilisateurs qui votent pour garder
  };
}