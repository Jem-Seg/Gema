"use client";
// Force dynamic rendering (évite erreurs prerendering)
export const dynamic = 'force-dynamic';


import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Wrapper from '@/app/components/Wrapper';
import { 
  Building2, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  X,
  MoreVertical,
  MapPin,
  Phone,
  Mail,
  Building,
  Users
} from 'lucide-react';

interface Ministere {
  id: string;
  name: string;
  abreviation: string;
  address?: string;
  phone?: string;
  email?: string;
  _count?: {
    structures: number;
    users: number;
  };
}

export default function MinisteresPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ministeres, setMinisteres] = useState<Ministere[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    abreviation: '',
    address: '',
    phone: '',
    email: ''
  });

  const loadMinisteres = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/ministeres');
      
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/admin/verify');
          return;
        }
        
        // Cloner la réponse pour pouvoir la lire plusieurs fois
        const responseClone = response.clone();
        let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await responseClone.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // Si on ne peut pas parser le JSON, garder le message d'erreur HTTP
          console.warn('Impossible de parser la réponse d\'erreur:', jsonError);
        }
        
        console.error('Erreur détaillée lors du chargement des ministères:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          message: errorMessage
        });
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setMinisteres(data.ministeres || []);
    } catch (error) {
      console.error('Erreur lors du chargement des ministères:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Problème de réseau - vérifiez que le serveur est démarré');
        alert('Erreur de connexion au serveur. Vérifiez que l\'application est démarrée.');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('Erreur détaillée:', errorMessage);
        alert('Impossible de charger les ministères. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'authenticated' && !user) {
      router.push('/sign-in');
      return;
    }

    if (status === 'authenticated' && user) {
      loadMinisteres();
    }
  }, [status === 'authenticated', user, router, loadMinisteres]);

  const resetForm = () => {
    setFormData({
      name: '',
      abreviation: '',
      address: '',
      phone: '',
      email: ''
    });
    setEditingId(null);
    setShowCreateForm(false);
  };

  const handleEdit = (ministere: Ministere) => {
    setFormData({
      name: ministere.name,
      abreviation: ministere.abreviation,
      address: ministere.address || '',
      phone: ministere.phone || '',
      email: ministere.email || ''
    });
    setEditingId(ministere.id);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId ? `/api/admin/ministeres/${editingId}` : '/api/admin/ministeres';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        await loadMinisteres();
        resetForm();
        alert(data.message || 'Opération réussie');
      } else {
        alert(data.error || 'Erreur lors de l\'opération');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce ministère ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ministeres/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        await loadMinisteres();
        alert(data.message || 'Ministère supprimé');
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }
  };

  if (status !== 'authenticated' || loading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="btn btn-ghost btn-sm shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Retour au tableau de bord</span>
              <span className="sm:hidden">Retour</span>
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Ministères</h1>
              <div className="badge badge-primary">
                {ministeres.length} ministère(s)
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nouveau Ministère</span>
            <span className="sm:hidden">Nouveau</span>
          </button>
        </div>

        {(showCreateForm || editingId) && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title">
                  {editingId ? 'Modifier le ministère' : 'Créer un nouveau ministère'}
                </h2>
                <button
                  onClick={resetForm}
                  className="btn btn-ghost btn-sm"
                  title="Fermer le formulaire"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Nom du ministère *</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="Nom du ministère"
                      title="Saisir le nom du ministère"
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Abréviation *</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={formData.abreviation}
                      onChange={(e) => setFormData({...formData, abreviation: e.target.value})}
                      required
                      placeholder="Ex: MIN"
                      title="Saisir l'abréviation du ministère"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Téléphone</span>
                    </label>
                    <input
                      type="tel"
                      className="input input-bordered w-full"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+221 XX XXX XX XX"
                      title="Saisir le numéro de téléphone"
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Email</span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered w-full"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="contact@ministere.sn"
                      title="Saisir l'adresse email"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Adresse</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Adresse complète du ministère"
                    title="Saisir l'adresse"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                  <button type="button" onClick={resetForm} className="btn btn-ghost w-full sm:w-auto">
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary w-full sm:w-auto">
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {ministeres.map((ministere) => (
            <div key={ministere.id} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20">
              <div className="card-body p-4 sm:p-6">
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="card-title text-base sm:text-lg font-semibold leading-tight mb-2" title={ministere.name}>
                      {ministere.name}
                    </h3>
                    <div className="badge badge-outline badge-sm sm:badge-md text-xs sm:text-sm" title={ministere.abreviation}>
                      {ministere.abreviation}
                    </div>
                  </div>
                  
                  {/* Actions mobiles directes */}
                  <div className="flex gap-1 sm:hidden">
                    <button
                      onClick={() => handleEdit(ministere)}
                      className="btn btn-ghost btn-xs text-primary hover:bg-primary/10"
                      title="Modifier"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(ministere.id)}
                      className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Menu dropdown desktop */}
                  <div className="dropdown dropdown-end shrink-0 hidden sm:block">
                    <button tabIndex={0} className="btn btn-ghost btn-sm hover:bg-base-200" title="Options de gestion">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10 border border-base-200">
                      <li>
                        <button onClick={() => handleEdit(ministere)} className="text-sm">
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>
                      </li>
                      <li>
                        <button onClick={() => handleDelete(ministere.id)} className="text-error text-sm">
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Informations détaillées */}
                <div className="space-y-2 mb-4">
                  {ministere.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-base-content/50 shrink-0 mt-0.5" />
                      <p className="text-sm text-base-content/70 leading-relaxed line-clamp-2" title={ministere.address}>
                        {ministere.address}
                      </p>
                    </div>
                  )}
                  {ministere.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-base-content/50 shrink-0" />
                      <a href={`tel:${ministere.phone}`} className="text-sm text-base-content/70 hover:text-primary transition-colors">
                        {ministere.phone}
                      </a>
                    </div>
                  )}
                  {ministere.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-base-content/50 shrink-0" />
                      <a href={`mailto:${ministere.email}`} className="text-sm text-base-content/70 hover:text-primary transition-colors truncate" title={ministere.email}>
                        {ministere.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Statistiques */}
                {ministere._count && (
                  <div className="flex flex-wrap gap-2 mb-4 pt-2 border-t border-base-200">
                    <div className="badge badge-info badge-sm">
                      <Building className="w-3 h-3 mr-1" />
                      {ministere._count.structures} structure{ministere._count.structures > 1 ? 's' : ''}
                    </div>
                    <div className="badge badge-success badge-sm">
                      <Users className="w-3 h-3 mr-1" />
                      {ministere._count.users} utilisateur{ministere._count.users > 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="card-actions pt-2">
                  <button
                    onClick={() => router.push(`/admin/structures?ministere=${ministere.id}`)}
                    className="btn btn-outline btn-sm w-full hover:btn-primary"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Gérer les structures</span>
                    <span className="sm:hidden">Structures</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {ministeres.length === 0 && (
          <div className="text-center py-8 sm:py-12 px-4">
            <Building2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-base-content/30 mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Aucun ministère défini</h2>
            <p className="text-sm sm:text-base text-base-content/70 mb-6 max-w-md mx-auto">
              Créez des ministères pour organiser la structure administrative de votre gouvernement.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary btn-sm sm:btn-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer le premier ministère
            </button>
          </div>
        )}
      </div>
    </Wrapper>
  );
}