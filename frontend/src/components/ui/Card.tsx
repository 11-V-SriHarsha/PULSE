import React from 'react'

type Props<T extends keyof JSX.IntrinsicElements = 'div'> = {
  as?: T
  className?: string
} & Omit<JSX.IntrinsicElements[T], 'className'>

function cn(...x: Array<string | undefined | false>) {
  return x.filter(Boolean).join(' ')
}

export default function Card<T extends keyof JSX.IntrinsicElements = 'div'>({ 
  as, 
  className, 
  ...rest 
}: Props<T>) {
  const Tag = (as || 'div') as T
  return (
    <Tag
      {...(rest as any)}
      className={cn(
        // base card style
        'card-elevated rounded-2xl border p-0',
        // light fallback when tokens aren’t available
        'bg-white border-gray-100',
        className
      )}
    />
  )
}
