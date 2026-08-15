import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { Dashboard } from './pages/Dashboard'
import { Settings } from './pages/Settings'
import { TestLabels } from './pages/TestLabels'
import { PrintLabel } from './pages/PrintLabel'

export default function App() {
  return (
    <div className="flex h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/test-labels" element={<TestLabels />} />
            <Route path="/print" element={<PrintLabel />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
