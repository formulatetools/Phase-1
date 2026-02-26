'use client'

import { forwardRef } from 'react'
import {
  btnBase,
  btnVariants,
  btnSizes,
  type ButtonVariant,
  type ButtonSize,
} from '@/components/ui/button-variants'

// Re-export for convenience — client components can import everything from here
export { buttonVariants } from '@/components/ui/button-variants'
export type { ButtonVariant, ButtonSize } from '@/components/ui/button-variants'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]}${className ? ` ${className}` : ''}`}
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
