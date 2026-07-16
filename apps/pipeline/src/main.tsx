import React from 'react'
import ReactDOM from 'react-dom/client'
import PipelineApp from './PipelineApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PipelineApp />
  </React.StrictMode>
)

export { PipelineApp } from './PipelineApp'
export { default as PipelineModule } from './PipelineModule'
