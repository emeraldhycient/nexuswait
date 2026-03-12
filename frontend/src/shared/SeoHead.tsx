import { useEffect } from 'react'

interface SeoHeadProps {
  title: string
  description?: string
  ogImage?: string
  slug?: string
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    if (name.startsWith('og:')) {
      el.setAttribute('property', name)
    } else {
      el.setAttribute('name', name)
    }
    document.head.appendChild(el)
  }
  el.content = content
}

export function SeoHead({ title, description, ogImage, slug }: SeoHeadProps) {
  useEffect(() => {
    const prev = document.title
    document.title = title

    if (description) setMeta('description', description)
    if (title) setMeta('og:title', title)
    if (description) setMeta('og:description', description)
    if (ogImage) setMeta('og:image', ogImage)
    if (slug) setMeta('og:url', `${window.location.origin}/w/${slug}`)
    setMeta('og:type', 'website')

    return () => {
      document.title = prev
    }
  }, [title, description, ogImage, slug])

  return null
}
