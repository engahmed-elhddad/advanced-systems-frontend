import { Variants, MotionProps } from 'framer-motion'

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

export const scaleHover: MotionProps = {
  whileHover: {
    scale: 1.05,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
}

export const glowHover: MotionProps = {
  whileHover: {
    boxShadow: '0 0 30px rgba(37,99,235,0.6)',
  },
}

export const tapScale: MotionProps = {
  whileTap: { scale: 0.97 },
}

export const imageHoverZoom: MotionProps = {
  whileHover: {
    scale: 1.05,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
}

