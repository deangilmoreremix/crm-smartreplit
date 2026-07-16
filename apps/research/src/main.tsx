import React from 'react'
import ReactDOM from 'react-dom/client'
import ResearchApp from './ResearchApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ResearchApp />
  </React.StrictMode>
)

export { ResearchApp } from './ResearchApp'
export { default as ResearchModule } from './ResearchModule'
