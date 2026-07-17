import './styles/App.css'
import { AuthProvider } from './context/AuthProvider'
import { NavProvider } from './context/NavProvider'
import { RootView } from './pages/RootView'

function App() {
  return (
    <div className="app-root">
      <AuthProvider>
        <NavProvider initialScreen="welcome">
          <RootView />
        </NavProvider>
      </AuthProvider>
    </div>
  )
}

export default App
