import { LandingPage } from './pages/LandingPage'
import { Footer } from './components/Footer'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <LandingPage />
        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App
