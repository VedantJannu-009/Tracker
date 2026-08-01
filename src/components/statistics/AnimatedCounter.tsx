import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  format?: (n: number) => string
  duration?: number
  delay?: number
}

export function AnimatedCounter({ value, format, duration = 1.2, delay = 0 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-32px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration,
      delay,
      ease: 'easeOut',
      onUpdate: v => setDisplay(v),
    })
    return () => controls.stop()
  }, [inView, value, duration, delay])

  const text = format ? format(display) : Math.round(display).toLocaleString()
  return <span ref={ref}>{text}</span>
}
