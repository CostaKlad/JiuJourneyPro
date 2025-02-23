import * as React from "react"

// Lower breakpoint for mobile-first approach
const MOBILE_BREAKPOINT = 480

export type Orientation = 'portrait' | 'landscape'

interface MobileState {
  isMobile: boolean
  orientation: Orientation
  isLandscape: boolean
  isPortrait: boolean
  hasTouchScreen: boolean
}

export function useIsMobile(): MobileState {
  const [state, setState] = React.useState<MobileState>({
    isMobile: false,
    orientation: 'portrait',
    isLandscape: false,
    isPortrait: true,
    hasTouchScreen: false
  })

  React.useEffect(() => {
    // Detect touch screen capability
    const detectTouch = () => {
      return 'ontouchstart' in window || 
             navigator.maxTouchPoints > 0 ||
             (navigator as any).msMaxTouchPoints > 0
    }

    // Update all mobile states
    const updateMobileState = () => {
      const orientation: Orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'

      setState({
        isMobile: window.innerWidth < MOBILE_BREAKPOINT,
        orientation,
        isLandscape: orientation === 'landscape',
        isPortrait: orientation === 'portrait',
        hasTouchScreen: detectTouch()
      })
    }

    // Listen to both resize and orientation change
    window.addEventListener('resize', updateMobileState)
    window.addEventListener('orientationchange', updateMobileState)

    // Initial check
    updateMobileState()

    return () => {
      window.removeEventListener('resize', updateMobileState)
      window.removeEventListener('orientationchange', updateMobileState)
    }
  }, [])

  return state
}

// Hook for handling viewport height on mobile
export function useMobileViewportHeight() {
  React.useEffect(() => {
    const updateHeight = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    window.addEventListener('resize', updateHeight)
    updateHeight()

    return () => window.removeEventListener('resize', updateHeight)
  }, [])
}

// Hook for preventing body scroll on mobile
export function usePreventMobileScroll(prevent: boolean) {
  React.useEffect(() => {
    if (!prevent) return

    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [prevent])
}