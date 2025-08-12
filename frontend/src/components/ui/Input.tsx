import { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm outline-none',
        'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400',
        'focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent',
        'shadow-sm hover:border-gray-300 dark:hover:border-gray-500 transition-colors',
        className
      )}
      {...props}
    />
  )
}
