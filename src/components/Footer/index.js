'use client'

import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.credits}>
          Desenvolvido por <span className={styles.developer}>Pablo Delgado</span>
        </p>
      </div>
    </footer>
  )
}
