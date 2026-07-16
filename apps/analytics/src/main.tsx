import React from 'react'
import ReactDOM from 'react-dom/client'
import AnalyticsApp from './AnalyticsApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AnalyticsApp />
  </React.StrictMode>
)

export { AnalyticsApp } from './AnalyticsApp'
export { default as AnalyticsModule } from './AnalyticsModule'
