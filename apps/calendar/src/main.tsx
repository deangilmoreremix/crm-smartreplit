import React from 'react'
import ReactDOM from 'react-dom/client'
import CalendarApp from './CalendarApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CalendarApp />
  </React.StrictMode>
)

export { CalendarApp } from './CalendarApp'
export { default as CalendarModule } from './CalendarModule'
