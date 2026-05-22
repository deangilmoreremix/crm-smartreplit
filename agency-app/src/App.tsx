// Agency App - Standalone wrapper when running as a standalone app
// The actual module federation exposed component is AIGoalsApp.tsx
import React from 'react'
import AIGoalsApp from './AIGoalsApp'

const App: React.FC = () => {
  return <AIGoalsApp />
}

export default App