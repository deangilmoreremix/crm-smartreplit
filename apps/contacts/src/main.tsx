import React from 'react'
import ReactDOM from 'react-dom/client'
import ContactsApp from './ContactsApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ContactsApp />
  </React.StrictMode>
)

export { ContactsApp } from './ContactsApp'
export { default as ContactsModule } from './ContactsModule'
