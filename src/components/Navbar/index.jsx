'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import MobileMenu from '../MobileMenu'
import styles from './Navbar.module.css'

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.logo}>
            CorrigeAI
          </Link>
          
          {/* Menu Desktop */}
          <div className={styles.desktopMenu}>
            <Link href="/" className={styles.navLink}>
              Chat
            </Link>
            <Link href="/sobre" className={styles.navLink}>
              Sobre
            </Link>
          </div>

          {/* Botão do Menu Mobile */}
          <button 
            className={styles.mobileMenuBtn}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Menu Mobile */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  )
}

export default Navbar
