import React from 'react'
import Image from 'next/image'

interface ProductImageProps {
  src: string;
  alt: string;
  widthClass: string;
  heightClass: string;
}
const ProductImage: React.FC<ProductImageProps> = ({ src, alt, widthClass, heightClass }) => {
  return (
    <div className='avatar'>
      <div className={`mask mask-squircle ${widthClass} ${heightClass}  `}>
        <Image
          src={src}
          alt={alt}
          quality={100}
          className='object-cover'
          width={500}
          height={500}
        />

      </div>

    </div>
  )
}

export default ProductImage
