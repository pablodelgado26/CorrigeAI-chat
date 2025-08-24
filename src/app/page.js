import ChatContainer from '../components/ChatContainer'
import Sidebar from '../components/Sidebar'

export default function Home() {
  return (
    <div className="app-container">
      <Sidebar />
      <ChatContainer />
    </div>
  )
}
