import React from 'react'
import { Ministere } from '@prisma/client'

interface Props {
  name: string;
  description: string;
  ministeres: Ministere[];
  loading: boolean;
  onclose: () => void;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onSubmit: () => void;
  editMode?: boolean;
}
const CategoryModal: React.FC<Props> = ({
  name, description, ministeres, loading, onclose, onChangeName, onChangeDescription, editMode, onSubmit
}) => {
  return (

    <dialog id="category_modal" className="modal">
      <div className="modal-box">
        <form method="dialog">
          {/* if there is a button in form, it will close the modal */}
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onclose}>
            ✕
          </button>
        </form>
        <h3 className="font-bold text-lg mb-4">
          {editMode ? 'Modifier la catégorie' : 'Ajouter une nouvelle catégorie'}
        </h3>
        <input
          type="text"
          placeholder='Nom de la catégorie'
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          className='input input-bordered w-full mb-4'
          required
        />

        <textarea
          placeholder='Description de la catégorie (optionnel)'
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          className='textarea textarea-bordered w-full mb-4'
          rows={3}
        />
        <button
          className='btn btn-primary'
          onClick={onSubmit}
          disabled={loading || !name.trim()}
        >
          {loading
            ? editMode
              ? 'Modification...'
              : 'Ajout...'
            : editMode
              ? 'Modifier'
              : 'Ajouter'}
        </button>

      </div>
    </dialog>
  )
}

export default CategoryModal
