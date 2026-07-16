import React from 'react'
import ReactDOM from 'react-dom/client'
import AgencyApp from './AgencyApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AgencyApp />
  </React.StrictMode>
)

export { AgencyApp } from './AgencyApp'
export { default as AgencyModule } from './AgencyModule'
