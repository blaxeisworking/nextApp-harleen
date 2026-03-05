/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/stores/ui-store'

function getSystemTheme(): 'light' | 'dark' {
	if (typeof window === 'undefined') return 'light'
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeToDocument(theme: 'light' | 'dark') {
	if (typeof document === 'undefined') return
	document.documentElement.classList.toggle('dark', theme === 'dark')
	document.documentElement.style.colorScheme = theme
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
	const theme = useUIStore((s) => s.theme)

	// Apply on mount + whenever theme changes.
	useEffect(() => {
		const effective = theme === 'system' ? getSystemTheme() : theme
		applyThemeToDocument(effective)
	}, [theme])

	// If user selected "system", react to OS theme changes.
	useEffect(() => {
		if (theme !== 'system') return
		if (typeof window === 'undefined') return

		const mql = window.matchMedia('(prefers-color-scheme: dark)')
		const onChange = () => applyThemeToDocument(getSystemTheme())

		// Safari uses addListener/removeListener.
		if ('addEventListener' in mql) {
			mql.addEventListener('change', onChange)
			return () => mql.removeEventListener('change', onChange)
		}
		// @ts-expect-error - legacy API
		mql.addListener(onChange)
		// @ts-expect-error - legacy API
		return () => mql.removeListener(onChange)
	}, [theme])

	return <>{children}</>
}
