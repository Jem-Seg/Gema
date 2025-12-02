'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Wrapper from '@/app/components/Wrapper';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface LogFile {
  name: string;
  sizeMB: number;
  date: string;
}

interface LogStats {
  totalFiles: number;
  totalSizeMB: number;
  oldestLog: string | null;
  newestLog: string | null;
  files: LogFile[];
}

const LogsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<LogStats | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [maxLines, setMaxLines] = useState(100);

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

    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/logs?action=stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        
        // Sélectionner automatiquement le fichier le plus récent
        if (data.data.newestLog && !selectedFile) {
          loadLogFile(data.data.newestLog);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const loadLogFile = async (fileName: string) => {
    try {
      setLoadingContent(true);
      setSelectedFile(fileName);

      const response = await fetch(`/api/admin/logs?action=read&file=${fileName}&lines=${maxLines}`);
      const data = await response.json();

      if (data.success) {
        setLogLines(data.data.lines);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Erreur chargement log:', error);
      toast.error('Erreur lors du chargement du fichier');
    } finally {
      setLoadingContent(false);
    }
  };

  const getLogLevelColor = (line: string): string => {
    if (line.includes('[DEBUG]')) return 'text-cyan-400';
    if (line.includes('[INFO]')) return 'text-green-400';
    if (line.includes('[WARN]')) return 'text-yellow-400';
    if (line.includes('[ERROR]')) return 'text-red-400';
    if (line.includes('[FATAL]')) return 'text-purple-400';
    return 'text-base-content';
  };

  const filterLogs = (lines: string[]): string[] => {
    let filtered = lines;

    // Filtre par texte
    if (filter.trim()) {
      const searchTerm = filter.toLowerCase();
      filtered = filtered.filter(line => line.toLowerCase().includes(searchTerm));
    }

    // Filtre par niveau
    if (levelFilter !== 'ALL') {
      filtered = filtered.filter(line => line.includes(`[${levelFilter}]`));
    }

    return filtered;
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

  const filteredLogs = filterLogs(logLines);

  return (
    <Wrapper>
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">📋 Logs Système</h1>
          <p className="text-base-content/70 mt-2">
            Consultation et analyse des journaux d&apos;application
          </p>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">Fichiers de log</div>
              <div className="stat-value text-primary">{stats.totalFiles}</div>
            </div>

            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">Espace total</div>
              <div className="stat-value text-secondary">{stats.totalSizeMB} MB</div>
            </div>

            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">Plus récent</div>
              <div className="stat-value text-sm">{stats.newestLog || 'N/A'}</div>
            </div>

            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">Plus ancien</div>
              <div className="stat-value text-sm">{stats.oldestLog || 'N/A'}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Liste des fichiers */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg">Fichiers disponibles</h2>
                
                {stats && stats.files.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {stats.files.map((file, index) => (
                      <div
                        key={index}
                        onClick={() => loadLogFile(file.name)}
                        className={`p-3 rounded cursor-pointer transition-colors ${
                          selectedFile === file.name
                            ? 'bg-primary text-primary-content'
                            : 'bg-base-200 hover:bg-base-300'
                        }`}
                      >
                        <div className="font-mono text-xs break-all">{file.name}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {file.sizeMB} MB • {formatDate(file.date)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-base-content/60 py-8">
                    <p>Aucun fichier de log</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenu du log */}
          <div className="lg:col-span-3">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                {/* Filtres */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Rechercher dans les logs..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="input input-bordered flex-1"
                  />

                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="select select-bordered"
                    aria-label="Filtrer par niveau de log"
                  >
                    <option value="ALL">Tous les niveaux</option>
                    <option value="DEBUG">🔍 DEBUG</option>
                    <option value="INFO">✅ INFO</option>
                    <option value="WARN">⚠️ WARN</option>
                    <option value="ERROR">❌ ERROR</option>
                    <option value="FATAL">💀 FATAL</option>
                  </select>

                  <select
                    value={maxLines}
                    onChange={(e) => {
                      setMaxLines(parseInt(e.target.value));
                      if (selectedFile) {
                        loadLogFile(selectedFile);
                      }
                    }}
                    className="select select-bordered"
                    aria-label="Nombre de lignes à afficher"
                  >
                    <option value="50">50 lignes</option>
                    <option value="100">100 lignes</option>
                    <option value="500">500 lignes</option>
                    <option value="1000">1000 lignes</option>
                  </select>

                  <button
                    onClick={() => selectedFile && loadLogFile(selectedFile)}
                    disabled={loadingContent || !selectedFile}
                    className="btn btn-primary"
                    title="Rafraîchir les logs"
                    aria-label="Rafraîchir les logs"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>

                {/* Zone de logs */}
                {loadingContent ? (
                  <div className="flex justify-center items-center h-96">
                    <div className="loading loading-spinner loading-lg"></div>
                  </div>
                ) : selectedFile ? (
                  <div className="bg-base-300 rounded-lg p-4 h-[600px] overflow-auto">
                    <div className="flex justify-between items-center mb-2 text-sm">
                      <span className="font-mono">{selectedFile}</span>
                      <span className="badge badge-ghost">
                        {filteredLogs.length} / {logLines.length} lignes
                      </span>
                    </div>
                    
                    <pre className="font-mono text-xs">
                      {filteredLogs.length > 0 ? (
                        filteredLogs.map((line, index) => (
                          <div key={index} className={`py-1 ${getLogLevelColor(line)}`}>
                            {line}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-base-content/60 py-8">
                          Aucun log correspondant aux filtres
                        </div>
                      )}
                    </pre>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-96 text-base-content/60">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>Sélectionnez un fichier de log</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informations */}
        <div className="alert alert-info mt-6">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">ℹ️ À propos des logs</h3>
            <div className="text-sm mt-1">
              <p>• Les logs sont automatiquement rotationnés par jour et par taille (max 10 MB)</p>
              <p>• Les fichiers de plus de 30 jours sont automatiquement supprimés</p>
              <p>• Les niveaux: DEBUG (développement) → INFO (info) → WARN (attention) → ERROR (erreur) → FATAL (critique)</p>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default LogsPage;
