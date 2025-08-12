import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

function cn(...x: Array<string | undefined | false>) {
  return x.filter(Boolean).join(' ')
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: Props) {
  const base =
    'btn inline-flex items-center justify-center rounded-xl border transition select-none disabled:opacity-60 disabled:cursor-not-allowed'

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
  }[size]

  const variants = {
    primary:
      // uses theme token; falls back to teal
      'btn-primary border-transparent bg-[var(--accent)] text-white hover:opacity-90',
    secondary:
      'bg-white text-gray-900 border-gray-200 hover:bg-gray-50 dark:bg-surface-2 dark:text-body',
    ghost:
      'bg-transparent border-transparent text-[var(--accent-2)] hover:opacity-80',
  }[variant]

  return <button {...rest} className={cn(base, sizes, variants, className)} />
}
