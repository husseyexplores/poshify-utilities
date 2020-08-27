import React from 'react'
import ReactDOM from 'react-dom'
import { AppProvider } from '@shopify/polaris'

import '@shopify/polaris/styles.css'
import 'antd/dist/antd.less'

import './App.scss'

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
const href = window.location.href.toLowerCase()
const isThemeCustomizer = /themes\/\d+\/editor/gi.test(href)
const isJsonEndpoint = href.includes('.json')
const isXmlEndpoint = href.includes('.xml')

// Must not be any of the following!
const shouldLoadApp = !isJsonEndpoint && !isXmlEndpoint && !isThemeCustomizer

let isMounted = false
let isNavAdded = false
let navFound = true // we assume that the nav is there

const selectors = {}
const TOGGLE_BTN_ID = 'poshify_toggle_btn'
const HIGHLIGHT_CLASS = 'poshify-active'

function loadApp() {
  if (isMounted || !shouldLoadApp) return

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
  if (!shouldLoadApp) return
  if (e && e.preventDefault && e.stopPropagation) {
    e.preventDefault()
    e.stopPropagation()
  }

  const app = selectors.app
  app.classList.toggle('open')
  isAppVisible = !isAppVisible

  try {
    // try highlighting the sidebar - if that exist
    const toggleBtn =
      selectors.extensionButtonLink || document.getElementById(TOGGLE_BTN_ID)
    if (!toggleBtn) return

    // Highlight sidebar navigation button
    toggleBtn.classList.toggle(HIGHLIGHT_CLASS)
  } catch (error) {} // eslint-disable-line no-empty
}

function addToShopifyNav() {
  if (!shouldLoadApp) return

  if (selectors.extensionButton) {
    selectors.extensionButton.style.display = 'block'
  }

  if (isNavAdded || !navFound) return

  try {
    let nav = null
    document.querySelectorAll('nav ul li a').forEach(el => {
      const href = (el.getAttribute('href') || '').toLowerCase()
      if (href === '/admin') {
        nav = el.closest('ul')
      }
    })

    if (!nav) {
      navFound = false
      return console.warn(
        '[Poshify] - Unable to find navigation to append the Poshify Utils button. Consider opening an issue at https://github.com/husseyexplores/poshify-utilities'
      )
    }

    const lastItem = nav.lastChild
    const extensionButton = lastItem.cloneNode(true)
    const extensionButtonLink = extensionButton.querySelector('a')
    extensionButtonLink.setAttribute('id', TOGGLE_BTN_ID)
    extensionButtonLink.setAttribute('href', '#')
    extensionButtonLink.querySelector('a > span').innerText = 'Poshify Utils'
    extensionButtonLink.classList.remove(HIGHLIGHT_CLASS)
    const extLinkClasses = Array.from(extensionButtonLink.classList)

    // Filter out classes with '-selected' in it
    const newClasses = extLinkClasses.filter(
      cls => cls.toLowerCase().indexOf('-selected') === -1
    )
    const extLinkHasSelectedClass = newClasses.length !== extLinkClasses.length
    if (extLinkHasSelectedClass) {
      extensionButtonLink.className = newClasses.join(' ')
    }

    extensionButton.querySelector('svg').outerHTML =
      '<svg height="32px" version="1.1" viewBox="0 0 50 50" width="32px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g fill="#bcc5ce" fill-rule="evenodd" class="svg-group-wrapper" stroke="none" stroke-width="1"><g id="letter-P"><g id="Page-1" transform="translate(5.000000, 2.000000)"><path d="M9.8333,4.6878 L6.0773,4.6878 L6.0773,13.1008 L9.8333,13.1008 C11.1483,13.1008 12.2463,12.9628 13.1293,12.6878 C14.0113,12.4128 14.6843,11.9618 15.1483,11.3358 C15.6113,10.7098 15.8423,9.8898 15.8423,8.8758 C15.8423,7.6608 15.4863,6.6718 14.7723,5.9088 C13.9713,5.0948 12.3243,4.6878 9.8333,4.6878 M11.1853,17.3078 L6.0773,17.3078 L6.0773,25.1008 C6.0773,26.2148 5.8143,27.0598 5.2883,27.6358 C4.7633,28.2118 4.0993,28.4998 3.2983,28.4998 C2.4593,28.4998 1.7833,28.2148 1.2703,27.6458 C0.7563,27.0758 0.5003,26.2398 0.5003,25.1388 L0.5003,3.9178 C0.5003,2.6908 0.7813,1.8148 1.3453,1.2888 C1.9083,0.7628 2.8033,0.4998 4.0303,0.4998 L11.1853,0.4998 C13.3013,0.4998 14.9283,0.6628 16.0683,0.9878 C17.1953,1.3008 18.1683,1.8208 18.9883,2.5468 C19.8083,3.2728 20.4313,4.1618 20.8563,5.2138 C21.2823,6.2648 21.4953,7.4488 21.4953,8.7628 C21.4953,11.5678 20.6313,13.6928 18.9033,15.1388 C17.1763,16.5848 14.6033,17.3078 11.1853,17.3078" fill="#2FBBF4" id="Fill-1"></path><path d="M9.8333,4.6878 L6.0773,4.6878 L6.0773,13.1008 L9.8333,13.1008 C11.1483,13.1008 12.2463,12.9628 13.1293,12.6878 C14.0113,12.4128 14.6843,11.9618 15.1483,11.3358 C15.6113,10.7098 15.8423,9.8898 15.8423,8.8758 C15.8423,7.6608 15.4863,6.6718 14.7723,5.9088 C13.9713,5.0948 12.3243,4.6878 9.8333,4.6878 L9.8333,4.6878 Z M11.1853,17.3078 L6.0773,17.3078 L6.0773,25.1008 C6.0773,26.2148 5.8143,27.0598 5.2883,27.6358 C4.7633,28.2118 4.0993,28.4998 3.2983,28.4998 C2.4593,28.4998 1.7833,28.2148 1.2703,27.6458 C0.7563,27.0758 0.5003,26.2398 0.5003,25.1388 L0.5003,3.9178 C0.5003,2.6908 0.7813,1.8148 1.3453,1.2888 C1.9083,0.7628 2.8033,0.4998 4.0303,0.4998 L11.1853,0.4998 C13.3013,0.4998 14.9283,0.6628 16.0683,0.9878 C17.1953,1.3008 18.1683,1.8208 18.9883,2.5468 C19.8083,3.2728 20.4313,4.1618 20.8563,5.2138 C21.2823,6.2648 21.4953,7.4488 21.4953,8.7628 C21.4953,11.5678 20.6313,13.6928 18.9033,15.1388 C17.1763,16.5848 14.6033,17.3078 11.1853,17.3078 L11.1853,17.3078 Z" id="Stroke-3" stroke="#092933" stroke-linejoin="round"></path><path d="M3.2979,27 C2.6009,27 2.0599,26.774 1.6419,26.311 C1.2159,25.839 0.9999,25.108 0.9999,24.139 L0.9999,25.139 C0.9999,26.108 1.2159,26.839 1.6419,27.311 C2.0599,27.774 2.6009,28 3.2979,28 C3.9579,28 4.4889,27.771 4.9199,27.299 C5.3559,26.821 5.5769,26.082 5.5769,25.101 L5.5769,24.101 C5.5769,25.082 5.3559,25.821 4.9199,26.299 C4.4889,26.771 3.9579,27 3.2979,27 M20.9749,8.284 C20.8759,10.689 20.0969,12.488 18.5829,13.755 C16.9559,15.117 14.4669,15.808 11.1859,15.808 L5.5769,15.808 L5.5769,16.808 L11.1859,16.808 C14.4669,16.808 16.9559,16.117 18.5829,14.755 C20.2059,13.396 20.9949,11.437 20.9949,8.763 C20.9949,8.599 20.9819,8.443 20.9749,8.284" fill="#332E09" id="Fill-5" opacity="0.203766325"></path><path d="M6.5123,2.145 L13.2863,2.145" id="Stroke-7" stroke="#FFFFFF" stroke-dasharray="1,2,6,2,3" stroke-linecap="round" stroke-linejoin="round"></path></g></g></g></svg>'
    nav.appendChild(extensionButton)

    extensionButton.addEventListener('click', toggleAppVisiblity)
    selectors.extensionButton = extensionButton
    selectors.extensionButtonLink = extensionButtonLink
    isNavAdded = true
  } catch (e) {
    console.warn('[Poshify] - Unable to append navigation to the sidebar.')
  }
}

function unmountApp() {
  if (!shouldLoadApp) return
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
  if (!shouldLoadApp) {
    sendResponse({ isMounted: false, isAppVisible: false })
    return true // must return true!
  }

  if (request.hasOwnProperty('mountApp')) {
    // Inject our app to DOM and send response
    addToShopifyNav()
    loadApp()
  }

  if (request.hasOwnProperty('unmountApp')) {
    // Unmount and send response
    unmountApp()
  }

  if (request.hasOwnProperty('toggleVisibility')) {
    // Inject our app to DOM and send response
    toggleAppVisiblity()
  }

  if (request.hasOwnProperty('getAppStatus')) {
    sendResponse({ isMounted, isAppVisible })
  }

  return true // important!
})

// on load
window.addEventListener('load', () => {
  if (!shouldLoadApp) return
  loadApp()
  setTimeout(() => {
    if (!isNavAdded) {
      return addToShopifyNav()
    }
  }, 3000)
})
