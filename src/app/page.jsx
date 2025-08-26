import React from 'react'
import ChatContainer from '../components/ChatContainer/index.jsx'
import Sidebar from '../components/Sidebar/index.jsx'

export default function Home() {
  return (
    <div className="app-container">
      <Sidebar />
      <ChatContainer />
    </div>
  )
}
