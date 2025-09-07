import { useEffect, useRef } from 'react'

interface UseScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export const useScrollReveal = (options: UseScrollRevealOptions = {}) => {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('revealed')
          if (triggerOnce) {
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          element.classList.remove('revealed')
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    // Add the scroll-reveal class initially
    element.classList.add('scroll-reveal')
    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce])

  return ref
}

export default useScrollReveal
