"use client"
import React from 'react'
import { useSession } from 'next-auth/react'
import Wrapper from '../components/Wrapper'
import { createProduct, getUserPermissionsInfo, getUserMinistereStructures } from '../actions'
import { Category } from '@prisma/client'
import { formDataType } from '@/type'
import { FileImage } from 'lucide-react'
import ProductImage from '../components/ProductImage'
import UnitSelector from '../components/UnitSelector'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'



type UserPermissions = {
  canCreate: boolean;
  canRead: boolean;
  scope: string;
}

type UserData = {
  structureId?: string;
  ministereId?: string;
  isAdmin?: boolean;
  role?: {
    name: string;
  };
}

function NewProductPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const [userPermissions, setUserPermissions] = React.useState<UserPermissions | null>(null)
  const [userData, setUserData] = React.useState<UserData | null>(null)
  const [availableStructures, setAvailableStructures] = React.useState<any[]>([])
  const [selectedStructureId, setSelectedStructureId] = React.useState<string>('')

  const router = useRouter();

  // Charger les informations de permissions de l'utilisateur
  React.useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id) return;

    const loadPermissions = async () => {
      try {
        const permissions = await getUserPermissionsInfo((user as any).id);
        setUserPermissions(permissions);

        // Récupérer aussi les structures de l'utilisateur pour avoir l'ID
        const userStructures = await getUserMinistereStructures((user as any).id);
        if (userStructures && userStructures.length > 0) {
          // Stocker toutes les structures disponibles
          const allStructures = userStructures.flatMap(m => 
            m.structures?.map(s => ({ ...s, ministereName: m.name })) || []
          );
          setAvailableStructures(allStructures);

          // Pour les rôles ministériels, ne pas pré-sélectionner de structure
          // Pour Agent de saisie, pré-sélectionner sa structure
          if (permissions.scope === 'structure' && allStructures.length > 0) {
            setSelectedStructureId(allStructures[0].id);
            setUserData({
              structureId: allStructures[0].id,
              ministereId: userStructures[0]?.id
            });
          } else if (permissions.scope === 'ministere') {
            setUserData({
              ministereId: userStructures[0]?.id
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des permissions:', error);
      }
    };
    loadPermissions();
  }, [status === 'authenticated', user])

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>('');
  const [formData, setFormData] = React.useState<formDataType>({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    unit: '',
    imageUrl: ''
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }
  React.useEffect(() => {
    // Charger les catégories depuis l'API
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }
  const handleSubmit = async () => {
    // Logique pour soumettre le formulaire de création de produit
    if (!file) {
      toast.error('Veuillez sélectionner une image pour le produit');
      return
    }

    const structureToUse = selectedStructureId || userData?.structureId;
    if (!structureToUse) {
      toast.error('Veuillez sélectionner une structure');
      return;
    }

    try {
      const imageData = new FormData();
      imageData.append('file', file as Blob);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: imageData
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error('Échec du téléchargement de l\'image');
      } else {
        formData.imageUrl = data.path
        await createProduct(formData, structureToUse);
        toast.success('Produit créé avec succès');
        router.push('/products');
      }
    } catch (error) {
      console.log(error);
      toast.error('Erreur lors de la création du produit');
    }
  }

  return (
    <Wrapper>
      {userPermissions && (
        <div>
          <div className='flex justify-center items-center'>
            <div>
              <h1 className='text-2xl font-bold mb-4'>
                Créer un nouveau produit
              </h1>
              <section className='flex md:flex-row flex-col'>
                <div className='space-y-4 md:w-[450px]'>
                  <input
                    type="text"
                    name="name"
                    placeholder="Désignation du produit"
                    className='input input-bordered w-full'
                    value={formData.name}
                    onChange={handleChange}
                  />
                  <textarea
                    name="description"
                    placeholder="Description du produit"
                    className='textarea textarea-bordered w-full'
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>

                  {/* Sélecteur de structure pour les rôles ministériels */}
                  {userPermissions.scope === 'ministere' && availableStructures.length > 0 && (
                    <select
                      className='select select-bordered w-full'
                      value={selectedStructureId}
                      onChange={(e) => setSelectedStructureId(e.target.value)}
                      aria-label="Sélectionner une structure"
                    >
                      <option value="">Choisir une structure...</option>
                      {availableStructures.map((structure) => (
                        <option key={structure.id} value={structure.id}>
                          {structure.name} ({structure.ministereName})
                        </option>
                      ))}
                    </select>
                  )}

                  <select
                    name="categoryId"
                    className='select select-bordered w-full'
                    value={formData.categoryId}
                    onChange={handleChange}
                    aria-label="Sélectionner une catégorie"
                  >
                    <option value="">Choisir une catégorie...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Unité de mesure *</span>
                    </label>
                    <UnitSelector
                      value={formData.unit}
                      onChange={(value) => setFormData({ ...formData, unit: value })}
                      required
                    />
                  </div>

                  <input
                    type="file"
                    name="image"
                    accessKey='image/*'
                    placeholder="Désignation du produit"
                    className='file-input file-input-bordered w-full'
                    onChange={handleFileChange}
                  />
                  <button onClick={handleSubmit} className='btn btn-primary w-full'>
                    Créer le produit
                  </button>
                </div>
                <div className='md:ml-4 md:w-[300px] mt-4 md:mt-0 border-2 border-dashed border-primary md:h-[300px] p-5 flex
                justify-center items-center rounded-3xl bg-base-100'>
                  {previewUrl && previewUrl !== "" ? (
                    <div>
                      <ProductImage
                        src={previewUrl}
                        alt="preview"
                        widthClass="w-40"
                        heightClass="h-40"
                      />
                    </div>
                  ) : (
                    <div className='animate-wiggle'>
                      <FileImage strokeWidth={1} className='h-10 w-10 text-primary' />
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  )
}

export default NewProductPage
