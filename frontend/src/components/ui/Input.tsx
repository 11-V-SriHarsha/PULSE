import { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none',
        'focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent',
        className
      )}
      {...props}
    />
  )
}
