"use client"
import React from 'react'
import { useSession } from 'next-auth/react'
import Wrapper from '../../components/Wrapper'
import { updateProduct, getUserPermissionsInfo, getUserMinistereStructures, getProductById, getAllCategoriesWithDetails } from '../../actions'
import { formDataType, Produit } from '@/type'
import Image from 'next/image'
import UnitSelector from '../../components/UnitSelector'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X, Package, DollarSign, Hash, Tag, FileText, Image as ImageIcon, Upload, Camera } from 'lucide-react'

type UserPermissions = {
  canCreate: boolean;
  canRead: boolean;
  scope: string;
  message: string;
}

type UserData = {
  structureId?: string;
  ministereId?: string;
  isAdmin?: boolean;
  role?: {
    name: string;
  };
}

type CategoryWithDetails = {
  id: string;
  name: string;
  description: string;
  structureId: string;
  structure: {
    name: string;
    ministere: {
      name: string;
    };
  };
}

interface UpdateProductPageProps {
  params: Promise<{
    productId: string;
  }>;
}

function UpdateProductPage({ params }: UpdateProductPageProps) {
  const resolvedParams = React.use(params);
  const { data: session, status } = useSession()
  const user = session?.user
  const [userPermissions, setUserPermissions] = React.useState<UserPermissions | null>(null)
  const [, setUserData] = React.useState<UserData | null>(null)
  const [product, setProduct] = React.useState<Produit | null>(null)
  const [loading, setLoading] = React.useState(true)

  const router = useRouter();

  // États pour le formulaire
  const [formData, setFormData] = React.useState<formDataType>({
    name: '',
    description: '',
    categoryId: '',
    price: 0,
    quantity: 0,
    unit: '',
    imageUrl: ''
  })
  const [categories, setCategories] = React.useState<CategoryWithDetails[]>([])
  const [submitting, setSubmitting] = React.useState(false)

  // États pour l'upload d'image
  const [imagePreview, setImagePreview] = React.useState<string>('')
  const [uploading, setUploading] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)

  // Fonction pour gérer la sélection d'image
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    processImageFile(file)
  }

  // Fonction pour traiter un fichier (utilisée par input et drag-drop)
  const processImageFile = (file: File) => {
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image valide (JPG, PNG, GIF)')
      return
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB')
      return
    }

    setUploading(true)
    toast.info('Traitement de l\'image...')

    // Créer l'aperçu
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
      setFormData(prev => ({ ...prev, imageUrl: result }))
      setUploading(false)
      toast.success('Image ajoutée avec succès !')
    }
    
    reader.onerror = () => {
      setUploading(false)
      toast.error('Erreur lors du traitement de l\'image')
    }
    
    reader.readAsDataURL(file)
  }

  // Fonctions pour le drag-and-drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      processImageFile(files[0])
    }
  }

  // Fonction pour supprimer l'image
  const handleRemoveImage = () => {
    setImagePreview('')
    setFormData(prev => ({ ...prev, imageUrl: '' }))
    // Reset les inputs file
    const fileInputs = ['image-upload', 'image-change']
    fileInputs.forEach(id => {
      const fileInput = document.getElementById(id) as HTMLInputElement
      if (fileInput) fileInput.value = ''
    })
  }

  // Charger les informations de permissions et le produit
  React.useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id) return;

    const loadData = async () => {
      try {
        setLoading(true)
        
        // Charger les permissions
        const permissions = await getUserPermissionsInfo((user as any).id);
        setUserPermissions(permissions);

        // Vérifier si l'utilisateur peut modifier des produits
        if (!permissions.canCreate) {
          toast.error('Vous n\'avez pas les permissions pour modifier des produits');
          router.push('/products');
          return;
        }

        // Charger le produit
        const productData = await getProductById(resolvedParams.productId, (user as any).id);
        if (!productData) {
          toast.error('Produit non trouvé');
          router.push('/products');
          return;
        }

        setProduct(productData);
        
        // Pré-remplir le formulaire avec les données du produit
        setFormData({
          id: productData.id,
          name: productData.name,
          description: productData.description,
          categoryId: productData.categoryId,
          price: productData.price,
          quantity: productData.quantity || 0,
          unit: productData.unit || '',
          imageUrl: productData.imageUrl || ''
        });

        // Récupérer les structures de l'utilisateur pour avoir l'ID
        const userStructures = await getUserMinistereStructures((user as any).id);
        if (userStructures && userStructures.length > 0) {
          const firstStructure = userStructures[0]?.structures?.[0];
          if (firstStructure) {
            setUserData({
              structureId: firstStructure.id,
              ministereId: userStructures[0]?.id
            });
          }
        }

        // Charger les catégories
        const categoriesData = await getAllCategoriesWithDetails((user as any).id);
        setCategories(categoriesData);

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error('Erreur lors du chargement du produit');
        router.push('/products');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [status === 'authenticated', (user as any)?.id, resolvedParams.productId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting) return;
    
    try {
      setSubmitting(true);
      
      // Validation basique (prix et quantité sont gérés via alimentations)
      if (!formData.name || !formData.categoryId) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (!(user as any)?.id || !product?.id) {
        toast.error('Erreur: données utilisateur manquantes');
        return;
      }

      // Mettre à jour le produit
      await updateProduct(product.id, formData, (user as any).id);
      
      toast.success('Produit mis à jour avec succès !');
      router.push('/products');
      
    } catch (error: unknown) {
      console.error('Erreur lors de la mise à jour:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du produit';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }



  if (loading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Wrapper>
    );
  }

  if (!userPermissions?.canCreate) {
    return (
      <Wrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="card bg-base-200 shadow-xl max-w-md">
            <div className="card-body text-center">
              <div className="text-warning text-6xl mb-4">⚠️</div>
              <h2 className="card-title justify-center text-2xl">Accès refusé</h2>
              <p className="text-base-content/70">
                Vous n&apos;avez pas les permissions nécessaires pour modifier des produits.
              </p>
              <div className="card-actions justify-center mt-6">
                <button 
                  className="btn btn-primary"
                  onClick={() => router.push('/products')}
                >
                  Retour aux produits
                </button>
              </div>
            </div>
          </div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {userPermissions && (
        <div>
          {/* En-tête amélioré */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="btn btn-ghost btn-sm flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <div className="badge badge-primary badge-outline">
                ID: {product?.id?.slice(-8)}
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Package className="w-8 h-8 text-primary" />
              Modifier le produit
            </h1>
            <p className="text-base-content/70 text-lg">
              Mise à jour des informations de : <span className="font-semibold text-primary">{product?.name}</span>
            </p>
          </div>

          {/* Contenu principal avec layout similaire à new-product */}
          <div className="flex justify-center items-start">
            <div className="w-full max-w-6xl">
              <form onSubmit={handleSubmit}>
                <section className="flex lg:flex-row flex-col gap-8">
                {/* Formulaire principal - côté gauche */}
                <div className="space-y-4 lg:w-[500px] flex-1">
                  {/* Nom du produit */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Nom du produit *
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="Désignation du produit"
                      className="input input-bordered w-full focus:input-primary"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Description
                      </span>
                    </label>
                    <textarea
                      placeholder="Description du produit"
                      className="textarea textarea-bordered w-full focus:textarea-primary"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  {/* Prix */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Prix (MRU)
                      </span>
                      <span className="label-text-alt text-warning">Lecture seule</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Aucun prix saisi"
                        className="input input-bordered w-full pr-16 bg-base-200 cursor-not-allowed"
                        value={formData.price || ''}
                        disabled
                        readOnly
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-base-content/60 font-medium">
                        MRU
                      </span>
                    </div>
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">Le prix ne peut être modifié qu'à travers une alimentation de stock</span>
                    </label>
                  </div>

                  {/* Catégorie */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Catégorie *
                      </span>
                    </label>
                    <select
                      className="select select-bordered w-full focus:select-primary"
                      value={formData.categoryId}
                      onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                      title="Choisir une catégorie"
                      required
                    >
                      <option value="">Choisir une catégorie...</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} - {category.structure.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantité */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Quantité
                      </span>
                      <span className="label-text-alt text-warning">Lecture seule</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Aucune quantité en stock"
                      className="input input-bordered w-full bg-base-200 cursor-not-allowed"
                      value={formData.quantity || ''}
                      disabled
                      readOnly
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">La quantité ne peut être modifiée qu'à travers les alimentations et octrois de stock</span>
                    </label>
                  </div>

                  {/* Unité - UnitSelector avec possibilité d'ajout personnalisé */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Unité de mesure</span>
                    </label>
                    <UnitSelector
                      value={formData.unit}
                      onChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                    />
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => router.back()}
                      className="btn btn-outline flex-1 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="btn btn-primary flex-1 flex items-center gap-2"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Mettre à jour
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Zone d'image - côté droit */}
                <div className="lg:ml-8 lg:w-[350px] mt-4 lg:mt-0">
                  <div 
                    className={`border-2 border-dashed lg:h-[400px] p-6 flex flex-col justify-center items-center rounded-3xl bg-base-100 hover:bg-base-200 transition-colors ${
                      isDragOver ? 'border-secondary bg-secondary/10' : 'border-primary'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {uploading ? (
                      <div className="text-center space-y-4 w-full">
                        <div className="loading loading-spinner loading-xl text-primary"></div>
                        <p className="text-lg font-semibold">Traitement de l&apos;image...</p>
                        <p className="text-sm text-base-content/50">Veuillez patienter</p>
                      </div>
                    ) : (formData.imageUrl && formData.imageUrl !== "") || imagePreview ? (
                      <div className="text-center space-y-4 w-full">
                        <div className="avatar mx-auto">
                          <div className="w-48 h-48 rounded-xl">
                            <Image 
                              src={imagePreview || formData.imageUrl || ''} 
                              alt="Aperçu du produit" 
                              className="object-cover"
                              width={192}
                              height={192}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-lg">
                            {imagePreview ? 'Nouvelle image' : 'Image actuelle'}
                          </p>
                          <p className="text-sm text-base-content/70 mb-4">
                            {imagePreview ? 'Cette image remplacera l\'ancienne' : 'Cette image représente votre produit'}
                          </p>
                          <div className="flex gap-2 justify-center">
                            <label className="btn btn-primary btn-sm flex items-center gap-2">
                              <Camera className="w-4 h-4" />
                              Changer
                              <input
                                id="image-change"
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                              />
                            </label>
                            <button 
                              type="button"
                              className="btn btn-error btn-sm flex items-center gap-2"
                              onClick={handleRemoveImage}
                            >
                              <X className="w-4 h-4" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center w-full">
                        {isDragOver ? (
                          <div className="animate-bounce">
                            <Upload strokeWidth={1} className="h-16 w-16 text-secondary mx-auto mb-4" />
                            <p className="text-lg font-semibold text-secondary mb-2">Relâchez pour ajouter l&apos;image</p>
                          </div>
                        ) : (
                          <>
                            <ImageIcon strokeWidth={1} className="h-16 w-16 text-primary mx-auto mb-4" />
                            <p className="text-lg font-semibold text-base-content/70 mb-2">Ajouter une image</p>
                            <p className="text-sm text-base-content/50 mb-4">
                              Glissez une image ici ou cliquez pour parcourir
                            </p>
                            <p className="text-xs text-base-content/40 mb-6">
                              Formats acceptés: JPG, PNG, GIF (max 5MB)
                            </p>
                            <label className="btn btn-primary flex items-center gap-2 mx-auto">
                              <Upload className="w-4 h-4" />
                              Choisir une image
                              <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                              />
                            </label>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
              </form>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  )
}

export default UpdateProductPage
