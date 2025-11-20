import { icons } from 'lucide-react'
import React, { FC } from 'react'

interface EmptyStateProps {
  iconComponent: keyof typeof icons,
  message: string
}
const EmptyState: FC<EmptyStateProps> = ({ iconComponent, message }) => {
  const SelectedIcon = icons[iconComponent];
  return (
    <div className='w-full h-full my-20 flex justify-center items-center flex-col'>
      <div className='animate-wiggle'>
        <SelectedIcon strokeWidth={1} className='w-30 h-30 text-primary' />
      </div>
      <p className='text-sm'>{message}</p>
    </div>
  )
}

export default EmptyState
