import React from 'react'
import ReactDOM from 'react-dom'
import { AppProvider } from '@shopify/polaris'
import axios from 'axios'
import '@shopify/polaris/styles.css'
import './App.css'

import App from './App'

// ------------------------------------------------------------------------------

function AppInIframe() {
  return (
    <AppProvider>
      <App />
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
ReactDOM.render(<AppInIframe />, app)

window.axios = axios
