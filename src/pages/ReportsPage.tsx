import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Flag, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import type { Report } from '../types';

export const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;

      try {
        const reportsRef = collection(db, 'reports');
        const q = query(
          reportsRef,
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Report[];
        setReports(reportsData);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  const handleVote = async (reportId: string, contentId: string, vote: 'hide' | 'keep') => {
    if (!user) return;

    try {
      const reportRef = doc(db, 'reports', reportId);
      const contentRef = doc(db, 'articles', contentId);

      // Ajoute le vote de l'utilisateur
      await updateDoc(reportRef, {
        [`votes.${vote}`]: arrayUnion(user.uid),
        [`votes.${vote === 'hide' ? 'keep' : 'hide'}`]: arrayRemove(user.uid)
      });

      // Met à jour l'état local
      setReports(prevReports =>
        prevReports.map(report => {
          if (report.id === reportId) {
            const updatedVotes = { ...report.votes };
            // Retire le vote opposé s'il existe
            const oppositeVote = vote === 'hide' ? 'keep' : 'hide';
            updatedVotes[oppositeVote] = updatedVotes[oppositeVote].filter(id => id !== user.uid);
            // Ajoute le nouveau vote s'il n'existe pas déjà
            if (!updatedVotes[vote].includes(user.uid)) {
              updatedVotes[vote] = [...updatedVotes[vote], user.uid];
            }
            return { ...report, votes: updatedVotes };
          }
          return report;
        })
      );

      // Si plus de 5 votes pour cacher et plus de votes pour cacher que pour garder
      const updatedReport = reports.find(r => r.id === reportId);
      if (updatedReport) {
        const hideVotes = updatedReport.votes.hide.length;
        const keepVotes = updatedReport.votes.keep.length;
        if (hideVotes >= 5 && hideVotes > keepVotes) {
          // Cache l'article
          await updateDoc(contentRef, {
            isHidden: true
          });
          // Marque le signalement comme résolu
          await updateDoc(reportRef, {
            status: 'resolved'
          });
          // Retire le signalement de la liste
          setReports(prevReports => prevReports.filter(r => r.id !== reportId));
        }
      }
    } catch (error) {
      console.error('Error voting on report:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Connexion requise
          </h1>
          <p className="text-gray-600">
            Vous devez être connecté pour voir les signalements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Flag className="text-red-600" size={32} />
            <h1 className="text-3xl font-bold">Signalements</h1>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des signalements...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">Aucun signalement en attente.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reports.map(report => (
                <div key={report.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{report.reporterName}</span>
                      <span>•</span>
                      <time>
                        {format(new Date(report.createdAt), "d MMMM yyyy", { locale: fr })}
                      </time>
                    </div>
                    <Link
                      to={`/article/${report.contentId}`}
                      className="text-red-600 hover:text-red-700"
                    >
                      Voir le contenu
                    </Link>
                  </div>

                  <p className="text-gray-700 mb-6">
                    {report.reason}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleVote(report.id, report.contentId, 'hide')}
                        className={`
                          flex items-center space-x-2 px-4 py-2 rounded-md
                          ${report.votes.hide.includes(user.uid)
                            ? 'bg-red-100 text-red-700'
                            : 'hover:bg-gray-100'}
                          transition-colors
                        `}
                      >
                        <EyeOff size={18} />
                        <span>Cacher ({report.votes.hide.length})</span>
                      </button>
                      <button
                        onClick={() => handleVote(report.id, report.contentId, 'keep')}
                        className={`
                          flex items-center space-x-2 px-4 py-2 rounded-md
                          ${report.votes.keep.includes(user.uid)
                            ? 'bg-green-100 text-green-700'
                            : 'hover:bg-gray-100'}
                          transition-colors
                        `}
                      >
                        <Eye size={18} />
                        <span>Garder ({report.votes.keep.length})</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
