import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "btn",
          {
            'btn-primary': variant === 'default',
            'btn-secondary': variant === 'secondary',
            'border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300': variant === 'outline',
            'btn-ghost': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600': variant === 'destructive',
            'bg-green-500 text-white hover:bg-green-600': variant === 'success',
          },
          {
            'btn-sm': size === 'sm',
            'btn-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }