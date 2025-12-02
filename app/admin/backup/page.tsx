'use client'

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Wrapper from '@/app/components/Wrapper';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface BackupInfo {
  fileName: string;
  filePath: string;
  size: number;
  sizeMB: string;
  createdAt: string;
  ageHours: string;
  ageDays: string;
}

interface BackupStats {
  totalBackups: number;
  totalSizeMB: number;
  oldestBackup: string | null;
  newestBackup: string | null;
}

const BackupPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/sign-in');
      return;
    }

    const isAdmin = 'isAdmin' in session.user && session.user.isAdmin === true;
    if (!isAdmin) {
      toast.error('Accès refusé - Administrateur requis');
      router.push('/dashboard');
      return;
    }

    loadBackups();
    loadStats();
  }, [session, status, router]);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/backup?action=list');
      const data = await response.json();

      if (data.success) {
        setBackups(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Erreur chargement sauvegardes:', error);
      toast.error('Erreur lors du chargement des sauvegardes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/backup?action=stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const createBackup = async () => {
    if (creating) return;

    const confirm = window.confirm(
      'Créer une nouvelle sauvegarde de la base de données ?'
    );

    if (!confirm) return;

    try {
      setCreating(true);
      toast.info('Création de la sauvegarde en cours...');

      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        loadBackups();
        loadStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Erreur création sauvegarde:', error);
      toast.error('Erreur lors de la création de la sauvegarde');
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (backupFilePath: string, fileName: string) => {
    if (restoring) return;

    const confirm = window.confirm(
      `⚠️ ATTENTION ⚠️\n\n` +
      `Cette action va :\n` +
      `- Écraser TOUTES les données actuelles\n` +
      `- Restaurer depuis : ${fileName}\n\n` +
      `Cette opération est IRRÉVERSIBLE !\n\n` +
      `Tapez "RESTAURER" pour confirmer`
    );

    if (!confirm) return;

    const doubleConfirm = window.prompt(
      'Tapez exactement "RESTAURER" pour continuer :'
    );

    if (doubleConfirm !== 'RESTAURER') {
      toast.warning('Restauration annulée');
      return;
    }

    try {
      setRestoring(true);
      toast.warning('Restauration en cours... Veuillez patienter');

      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupFilePath })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        toast.info('Rechargement de la page dans 3 secondes...');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Erreur restauration:', error);
      toast.error('Erreur lors de la restauration');
    } finally {
      setRestoring(false);
    }
  };

  const cleanOldBackups = async () => {
    if (cleaning) return;

    const confirm = window.confirm(
      'Supprimer toutes les sauvegardes de plus de 30 jours ?\n\nNote: Les 3 sauvegardes les plus récentes seront toujours conservées.'
    );

    if (!confirm) return;

    try {
      setCleaning(true);
      toast.info('Nettoyage en cours...');

      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'clean',
          retentionDays: 30,
          keepLast: 3
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        loadBackups();
        loadStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Erreur nettoyage:', error);
      toast.error('Erreur lors du nettoyage');
    } finally {
      setCleaning(false);
    }
  };

  const deleteBackup = async (filePath: string, fileName: string) => {
    const confirm = window.confirm(
      `Supprimer définitivement cette sauvegarde ?\n\n${fileName}\n\nCette action est irréversible.`
    );

    if (!confirm) return;

    try {
      toast.info('Suppression en cours...');

      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'delete',
          backupFilePath: filePath
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        loadBackups();
        loadStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-96">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">💾 Sauvegardes & Restauration</h1>
          <p className="text-base-content/70 mt-2">
            Gestion des sauvegardes de la base de données
          </p>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">Total Sauvegardes</div>
              <div className="stat-value text-primary">{stats.totalBackups}</div>
            </div>
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">Espace Total</div>
              <div className="stat-value text-secondary">{stats.totalSizeMB.toFixed(2)} MB</div>
            </div>
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">Plus Récente</div>
              <div className="stat-value text-sm">
                {stats.newestBackup ? formatDate(stats.newestBackup).split(' ')[0] : 'N/A'}
              </div>
            </div>
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">Plus Ancienne</div>
              <div className="stat-value text-sm">
                {stats.oldestBackup ? formatDate(stats.oldestBackup).split(' ')[0] : 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={createBackup}
            disabled={creating}
            className="btn btn-primary"
          >
            {creating ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Création en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Créer Sauvegarde
              </>
            )}
          </button>

          <button
            onClick={loadBackups}
            disabled={loading}
            className="btn btn-outline"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>

          <button
            onClick={cleanOldBackups}
            disabled={cleaning}
            className="btn btn-warning"
          >
            {cleaning ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Nettoyage...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Nettoyer Anciennes
              </>
            )}
          </button>
        </div>

        {/* Liste des sauvegardes */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Sauvegardes Disponibles</h2>

            {backups.length === 0 ? (
              <div className="text-center py-8 text-base-content/60">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>Aucune sauvegarde disponible</p>
                <p className="text-sm mt-2">Créez votre première sauvegarde</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nom du Fichier</th>
                      <th>Date de Création</th>
                      <th>Âge</th>
                      <th>Taille</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup, index) => (
                      <tr key={index}>
                        <td>
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="font-mono text-sm">{backup.fileName}</span>
                          </div>
                        </td>
                        <td>{formatDate(backup.createdAt)}</td>
                        <td>
                          <span className="badge badge-ghost">
                            {backup.ageDays} jours
                          </span>
                        </td>
                        <td>{backup.sizeMB} MB</td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => restoreBackup(backup.filePath, backup.fileName)}
                              disabled={restoring}
                              className="btn btn-sm btn-primary"
                            >
                              {restoring ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Restaurer
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={() => deleteBackup(backup.filePath, backup.fileName)}
                              className="btn btn-sm btn-error btn-outline"
                              title="Supprimer cette sauvegarde"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Avertissements */}
        <div className="alert alert-info mt-6">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">ℹ️ Nettoyage automatique des sauvegardes</h3>
            <div className="text-sm mt-1">
              <p>• Le bouton &quot;Nettoyer Anciennes&quot; supprime les sauvegardes de plus de 30 jours</p>
              <p>• Les 3 sauvegardes les plus récentes sont TOUJOURS conservées (même si &gt; 30 jours)</p>
              <p>• Pour supprimer une sauvegarde spécifique, utilisez le bouton 🗑️ dans la liste</p>
            </div>
          </div>
        </div>

        <div className="alert alert-warning mt-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-bold">⚠️ Avertissement - Restauration</h3>
            <div className="text-sm mt-1">
              <p>• La restauration écrase TOUTES les données actuelles de manière irréversible</p>
              <p>• Une sauvegarde de sécurité est créée automatiquement avant chaque restauration</p>
              <p>• Assurez-vous que personne n&apos;utilise l&apos;application pendant la restauration</p>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default BackupPage;
