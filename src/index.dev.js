import React from 'react'
import ReactDOM from 'react-dom'
import { AppProvider } from '@shopify/polaris'
import '@shopify/polaris/styles.css'
import 'antd/dist/antd.less'

import './App.css'
import App from './App'

// ------------------------------------------------------------------------------

function AppWithProvider() {
  return (
    <AppProvider>
      <App env="dev" />
    </AppProvider>
  )
}

// ------------------------------------------------------------------------------

// Add app container
const app = document.createElement('div')
app.setAttribute('id', 'dev_app')

// Append the elements to the DOM
document.body.appendChild(app)

// Render the app
ReactDOM.render(<AppWithProvider />, app)
