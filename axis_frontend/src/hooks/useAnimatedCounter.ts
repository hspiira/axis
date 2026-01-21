import { useState, useEffect, useRef } from 'react'

export function useAnimatedCounter(
  targetValue: number,
  duration: number = 2000,
  startAnimation: boolean = true
) {
  const [count, setCount] = useState(0)
  const startValueRef = useRef(0)
  const isInitialMount = useRef(true)
  const animationFrameIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!startAnimation) {
      setCount(targetValue)
      startValueRef.current = targetValue
      return
    }

    // On first mount, start from 0
    if (isInitialMount.current) {
      isInitialMount.current = false
      startValueRef.current = 0
    }

    // Cancel any ongoing animation
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current)
    }

    const startValue = startValueRef.current
    const difference = targetValue - startValue

    // For very small changes or no change, update immediately
    if (Math.abs(difference) < 0.1) {
      setCount(targetValue)
      startValueRef.current = targetValue
      return
    }

    // Use shorter duration for small increments to make them feel snappy
    const animationDuration = Math.abs(difference) < 5 ? 800 : duration

    let startTime: number | null = null

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / animationDuration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = startValue + (easeOutQuart * difference)

      // For integers, round appropriately
      const displayCount = Math.round(currentCount)
      setCount(displayCount)

      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate)
      } else {
        setCount(targetValue)
        startValueRef.current = targetValue
        animationFrameIdRef.current = null
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
    }
  }, [targetValue, duration, startAnimation])

  return count
}

