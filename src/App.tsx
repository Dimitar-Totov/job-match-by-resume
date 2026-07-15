import './styles/App.css'
import { NavProvider } from './context/NavProvider'
import { RootView } from './pages/RootView'

function App() {
  return (
    <div className="app-root">
      <NavProvider initialScreen="welcome">
        <RootView />
      </NavProvider>
    </div>
  )
}

export default App
