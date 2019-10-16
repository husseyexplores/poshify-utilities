import React from 'react'
import ReactDOM from 'react-dom'
import { AppProvider } from '@shopify/polaris'
import '@shopify/polaris/styles.css'
import './App.css'
import App from './App'

// ------------------------------------------------------------------------------

function AppWithProvider() {
  return (
    <div className="Metafields_App_Wrapper">
      <AppProvider>
        <App env="prod" />
      </AppProvider>
    </div>
  )
}

// ------------------------------------------------------------------------------

let isMounted = false
let isNavAdded = false

const selectors = {}
const NAV_SELECTOR = 'nav .gIRv5'
const HIGHLIGHT_CLASS = '_2E4v6'

function loadApp() {
  if (isMounted) return

  // App container/root
  let app = selectors.app
  if (!app) {
    app = document.createElement('div')
    app.setAttribute('id', 'shopify_metafields_app_root')
    app.classList.add('shopify_metafields_app_root')
    selectors.app = app
    app.addEventListener('click', e => {
      const target = e.target
      if (target && target.id === 'shopify_metafields_app_root') {
        toggleAppVisiblity()
      }
    })
    // Append to DOM
    document.body.appendChild(app)
  }

  // Render the app
  ReactDOM.render(<AppWithProvider />, app)
  isMounted = true
}

// Toggle app visibility
let isAppVisible = false
function toggleAppVisiblity(e) {
  if (e && e.preventDefault && e.stopPropagation) {
    e.preventDefault()
    e.stopPropagation()
  }

  const app = selectors.app
  const toggleBtn = document.getElementById(
    'extension_metafields_editor_toggle'
  )
  selectors.toggleBtn = toggleBtn

  if (!app || !toggleBtn) return

  // Highlight sidebar navigation button
  toggleBtn.classList.toggle(HIGHLIGHT_CLASS)
  app.classList.toggle('open')
  isAppVisible = !isAppVisible
}

function addToShopifyNav() {
  if (selectors.extensionButton) {
    selectors.extensionButton.style.display = 'block'
  }

  if (isNavAdded) return

  const nav = document.querySelector(NAV_SELECTOR)

  if (!nav) {
    return alert(
      'Unable to find navigation to append the Metafields button. Consider opening an issue at github.com/husseyexplores/shopify-metafields-editor'
    )
  }

  const lastItem = nav.lastChild
  const extensionButton = lastItem.cloneNode(true)
  extensionButton
    .querySelector('a')
    .setAttribute('id', 'extension_metafields_editor_toggle')
  extensionButton.querySelector('a').setAttribute('href', '#')
  extensionButton.querySelector('a > span').innerText = 'Metafields'
  extensionButton.querySelector('a').classList.remove(HIGHLIGHT_CLASS)
  extensionButton.querySelector('svg').outerHTML =
    '<svg viewBox="0 0 20 20" class="v3ASA" focusable="false" aria-hidden="true"><path fill="currentColor" d="M10 13a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm7-3c0-.53-.064-1.044-.176-1.54L19 7.23l-2.047-3.464-2.106 1.188A6.978 6.978 0 0 0 12 3.292V1H8v2.294a6.99 6.99 0 0 0-2.847 1.662L3.047 3.768 1 7.232 3.176 8.46C3.064 8.955 3 9.47 3 10s.064 1.044.176 1.54L1 12.77l2.047 3.464 2.106-1.188A6.99 6.99 0 0 0 8 16.708V19h4v-2.294a6.99 6.99 0 0 0 2.847-1.662l2.106 1.188L19 12.768l-2.176-1.227c.112-.49.176-1.01.176-1.54z"></path><path d="M19.492 11.897l-1.56-.88a7.63 7.63 0 0 0 .001-2.035l1.56-.88a1 1 0 0 0 .369-1.38L17.815 3.26a1 1 0 0 0-1.353-.363l-1.49.84A8.077 8.077 0 0 0 13 2.587V1a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1.586a8.072 8.072 0 0 0-1.97 1.152l-1.492-.84a1 1 0 0 0-1.352.36L.14 6.724a1.004 1.004 0 0 0 .369 1.381l1.55.88C2.02 9.325 2 9.665 2 10s.023.675.068 1.017l-1.56.88a1 1 0 0 0-.369 1.372l2.04 3.46c.27.47.87.63 1.35.36l1.49-.844c.6.48 1.26.87 1.97 1.154V19c0 .552.443 1 1 1h4c.55 0 1-.448 1-1v-1.587c.7-.286 1.37-.675 1.97-1.152l1.49.85a.992.992 0 0 0 1.35-.36l2.047-3.46a1.006 1.006 0 0 0-.369-1.38zm-3.643-3.22c.1.45.15.894.15 1.323s-.05.873-.15 1.322c-.1.43.1.873.48 1.09l1.28.725-1.03 1.742-1.257-.71a.988.988 0 0 0-1.183.15 6.044 6.044 0 0 1-2.44 1.42.99.99 0 0 0-.714.96V18H9v-1.294c0-.443-.29-.833-.714-.96a5.985 5.985 0 0 1-2.44-1.424 1 1 0 0 0-1.184-.15l-1.252.707-1.03-1.75 1.287-.73c.385-.22.58-.66.485-1.09A5.907 5.907 0 0 1 4 10c0-.43.05-.874.152-1.322a1 1 0 0 0-.485-1.09L2.38 6.862 3.41 5.12l1.252.707a.998.998 0 0 0 1.184-.15 6.02 6.02 0 0 1 2.44-1.425A1 1 0 0 0 9 3.294V2h2v1.294c0 .442.29.832.715.958.905.27 1.75.762 2.44 1.426.317.306.8.365 1.183.15l1.253-.708 1.03 1.742-1.28.726a.999.999 0 0 0-.48 1.09zM10 6c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4zm0 6c-1.103 0-2-.897-2-2s.897-2 2-2 2 .897 2 2-.897 2-2 2z"></path></svg>'
  nav.appendChild(extensionButton)

  extensionButton.addEventListener('click', toggleAppVisiblity)
  selectors.extensionButton = extensionButton
  isNavAdded = true
}

function unmountApp() {
  if (!isMounted) return

  if (selectors.extensionButton) {
    selectors.extensionButton.style.display = 'none'
  }

  // Hide main app
  if (isAppVisible) {
    toggleAppVisiblity()
  }

  if (selectors.app) {
    ReactDOM.unmountComponentAtNode(selectors.app)
    isMounted = false
  }
}

/* global chrome */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.hasOwnProperty('mountApp')) {
    // Inject our app to DOM and send response
    addToShopifyNav()
    loadApp()

    sendResponse({
      isMounted: true,
    })
  }

  if (request.hasOwnProperty('unmountApp')) {
    // Unmount and send response
    unmountApp()

    sendResponse({
      isMounted: false,
    })
  }

  if (request.hasOwnProperty('getMountStatus')) {
    sendResponse({
      isMounted,
    })
  }
})
