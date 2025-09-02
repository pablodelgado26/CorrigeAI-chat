'use client'

import styles from './Loading.module.css'

export default function Loading({ 
  size = 'medium', 
  color = 'primary', 
  text = '',
  fullScreen = false 
}) {
  const sizeClass = styles[`size-${size}`]
  const colorClass = styles[`color-${color}`]
  
  const spinner = (
    <div className={`${styles.loadingContainer} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={`${styles.spinner} ${sizeClass} ${colorClass}`}>
        <div className={styles.spinnerInner}></div>
      </div>
      {text && <p className={styles.loadingText}>{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className={styles.overlay}>
        {spinner}
      </div>
    )
  }

  return spinner
}

// Componente para loading inline
export function InlineLoading({ size = 'small', color = 'primary' }) {
  return (
    <div className={`${styles.spinner} ${styles[`size-${size}`]} ${styles[`color-${color}`]} ${styles.inline}`}>
      <div className={styles.spinnerInner}></div>
    </div>
  )
}

// Componente para dots animados (usado no chat)
export function LoadingDots({ color = 'primary', size = 'medium' }) {
  return (
    <div className={`${styles.loadingDots} ${styles[`color-${color}`]} ${styles[`size-${size}`]}`}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  )
}
