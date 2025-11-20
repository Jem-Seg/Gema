import React from 'react'
import Navbar from './Navbar'
import Stock from './Stock'

type WrapperProps = {
  children: React.ReactNode
}

const Wrapper = ({ children }: WrapperProps) => {
  return (
    <div>
      <Navbar />
      <div className=' px-5 md:px-[10%] mt-8 mb-10'>
        {children}
      </div>
      
      {/* Modals globaux */}
      <Stock />
    </div>
  )
}

export default Wrapper
