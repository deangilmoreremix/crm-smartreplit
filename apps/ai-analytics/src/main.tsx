import React from 'react'
import ReactDOM from 'react-dom/client'
import MultiAnalyticsApp from './MultiAnalyticsApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MultiAnalyticsApp />
  </React.StrictMode>
)

export { MultiAnalyticsApp } from './MultiAnalyticsApp'
export { CrossAppInsights } from './CrossAppInsights'
