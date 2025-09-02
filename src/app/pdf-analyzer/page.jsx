import React from 'react'
import PDFAnalyzer from '../../components/PDFAnalyzer/index.jsx'
import Sidebar from '../../components/Sidebar/index.jsx'

export default function PDFAnalyzerPage() {
  return (
    <div className="app-container">
      <Sidebar />
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'auto',
        background: '#f5f5f5',
        padding: '1rem'
      }}>
        <PDFAnalyzer />
      </div>
    </div>
  )
}
