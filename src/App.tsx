import { useState, useMemo } from 'react'
import RiskRewardInterface from './components/RiskRewardInterface'
import RiskRewardDemo from './components/RiskRewardDemo'

function App() {
  const isEmbed = useMemo(() => {
    return new URLSearchParams(window.location.search).get('embed') === 'true'
  }, [])

  const [showDemo, setShowDemo] = useState(false)

  if (isEmbed) {
    return <RiskRewardInterface embed />
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <button
          onClick={() => setShowDemo(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !showDemo 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          原版 Prototype
        </button>
        <button
          onClick={() => setShowDemo(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            showDemo 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Framer 动效演示
        </button>
      </div>

      {showDemo ? (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <RiskRewardDemo />
          </div>
        </div>
      ) : (
        <RiskRewardInterface />
      )}
    </div>
  )
}

export default App
