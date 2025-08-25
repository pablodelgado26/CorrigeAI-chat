'use client'

import React from 'react'
import styles from './Footer.module.css'

function Footer() {
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

export default Footer
