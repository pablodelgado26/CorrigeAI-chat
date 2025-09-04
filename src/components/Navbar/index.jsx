'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import MobileMenu from '../MobileMenu/index.jsx'
import LoginModal from '../LoginModal/index.jsx'
import SignupModal from '../SignupModal/index.jsx'
import styles from './Navbar.module.css'

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)
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

  const handleSwitchToSignup = () => {
    setIsLoginModalOpen(false)
    setIsSignupModalOpen(true)
  }

  const handleSwitchToLogin = () => {
    setIsSignupModalOpen(false)
    setIsLoginModalOpen(true)
  }

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoContainer}>
              <span className={styles.logoIcon}>🎯</span>
              <div className={styles.logoText}>
                <span className={styles.brandName}>CorrigeAI</span>
                <span className={styles.brandSubtitle}>ESCOLA SESI</span>
              </div>
            </div>
          </Link>
          
          {/* Menu Desktop */}
          <div className={styles.desktopMenu}>
            <Link href="/" className={styles.navLink}>
              Chat
            </Link>
            <Link href="/sobre" className={styles.navLink}>
              Sobre
            </Link>
            
            {user ? (
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
                      {user.role === 'ADMIN' && (
                        <>
                          <Link 
                            href="/admin" 
                            className={styles.dropdownItem}
                            onClick={() => setIsAccountDropdownOpen(false)}
                          >
                            <span className={styles.dropdownIcon}>⚙️</span>
                            Painel Admin
                          </Link>
                          <div className={styles.dropdownDivider}></div>
                        </>
                      )}
                      
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
            ) : (
              <div className={styles.authButtons}>
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className={styles.loginBtn}
                >
                  Entrar
                </button>
                <button 
                  onClick={() => setIsSignupModalOpen(true)}
                  className={styles.signupBtn}
                >
                  Criar conta
                </button>
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

      {/* Modais de Autenticação */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={handleSwitchToSignup}
      />
      
      <SignupModal 
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  )
}

export default Navbar
