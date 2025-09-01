'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import MobileMenu from '../MobileMenu/index.jsx'
import styles from './Navbar.module.css'

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const { user, logout } = useAuth()
  const dropdownRef = useRef(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    setIsAccountDropdownOpen(false)
    logout()
  }

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.logo}>
            🤖 CorrigeAI
          </Link>
          
          {/* Menu Desktop */}
          <div className={styles.desktopMenu}>
            <Link href="/" className={styles.navLink}>
              Chat
            </Link>
            <Link href="/sobre" className={styles.navLink}>
              Sobre
            </Link>
            
            {user && (
              <div className={styles.accountSection} ref={dropdownRef}>
                <button 
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className={styles.accountBtn}
                  aria-label="Menu da conta"
                >
                  <span className={styles.userAvatar}>
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={`${styles.dropdownArrow} ${isAccountDropdownOpen ? styles.open : ''}`}>
                    ▼
                  </span>
                </button>

                {isAccountDropdownOpen && (
                  <div className={styles.accountDropdown}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.userInfo}>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>

                    
                    <div className={styles.dropdownMenu}>

                      
                      <div className={styles.dropdownDivider}></div>
                      
                      <button 
                        onClick={handleLogout}
                        className={`${styles.dropdownItem} ${styles.logoutItem}`}
                      >
                        <span className={styles.dropdownIcon}>🚪</span>
                        Sair da Conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
        user={user}
        onLogout={logout}
      />
    </>
  )
}

export default Navbar
