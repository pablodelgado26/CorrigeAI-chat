'use client'

import React, { useRef } from 'react'
import styles from './ImageUpload.module.css'

function ImageUpload({ onImageUpload }) {
  const fileInputRef = useRef(null)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        onImageUpload(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={styles.imageUpload}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={handleClick}
        className={styles.uploadBtn}
        title="Anexar imagem"
      >
        📎
      </button>
    </div>
  )
}

export default ImageUpload
