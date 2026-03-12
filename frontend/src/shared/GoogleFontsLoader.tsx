import { useEffect } from 'react'

interface GoogleFontsLoaderProps {
  /** A fully-formed Google Fonts CSS2 URL (built via buildGoogleFontsUrl) */
  url: string
}

export function GoogleFontsLoader({ url }: GoogleFontsLoaderProps) {
  useEffect(() => {
    if (!url) return

    const existing = document.querySelector(`link[href="${url}"]`)
    if (existing) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)

    return () => {
      link.remove()
    }
  }, [url])

  return null
}
