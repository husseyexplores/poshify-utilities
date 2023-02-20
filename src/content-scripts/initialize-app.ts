import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import App from './App'
import { DEV, Logger, hasProp, PROD } from '$utils'
import { fetchCsrfTokens } from '$lib/csrf'
// @ts-expect-error
import AppIconSvg from '../icon.svg'

/*
@TODO:
  - If the form is dirty, show confirm dialog before navigating
  - upload file
  - Bulk editor
*/

const EL = {
  ROOT: {
    id: 'PoshifyUtils_Root',
  },
  TOGGLE_BTN: {
    id: 'PoshifyUtils_ToggleBtn',
    highlightClassses: [
      'PoshifyUtils_ToggleActive',
      'Polaris-Navigation__Item--selected',
    ],
    parentHighlightClasses: ['Polaris-Navigation__ItemInnerWrapper--selected'],
  },
}
/*
class XPoshifyUtils extends HTMLElement {
  _ac: null | AbortController
  _showing: boolean
  _instance: Root
  _rendered: boolean
  App?: () => JSX.Element
  _toggleButton: ReturnType<typeof getSidebarButton>

  constructor() {
    super()
    this._ac = null
    this._showing = false
    this._instance = createRoot(this)
    this._rendered = false
  }

  connectedCallback() {
    this.classList.add('PoshifyUtils_Root')

    this._ac?.abort()
    this._ac = new AbortController()

    // Toggle on click
    this.addEventListener(
      'click',
      ({ target }) => {
        if (target === this) {
          console.log('Toggle visiblity on click', { target })
          this.toggleAppVisibility()
        }
      },
      { signal: this._ac.signal }
    )

    this._toggleButton = getSidebarButton()
    if (this._toggleButton) {
      this._toggleButton.li.addEventListener(
        'click',
        () => {
          this.toggleAppVisibility()
        },
        { signal: this._ac.signal }
      )
    }

    this.toggleAppVisibility(false)
  }

  disconnectedCallback() {
    this._ac?.abort()
    this._ac = null
  }

  toggleAppVisibility(show?: boolean) {
    const nextShowing = show != null ? !!show : !this._showing
    const hidden = !nextShowing
    // Toggle aria-hidden

    this.setAttribute('aria-hidden', hidden.toString())

    this._showing = nextShowing

    // Update hightlited class of sidebar button
    const toggleBtn = this._toggleButton
    if (toggleBtn) {
      const fn = nextShowing ? 'add' : 'remove'
      EL.TOGGLE_BTN.highlightClassses.forEach(c => {
        toggleBtn.anchor.classList[fn]?.(c)
      })
      EL.TOGGLE_BTN.parentHighlightClasses.forEach(c => {
        toggleBtn.anchor.parentElement?.classList[fn]?.(c)
      })
    }
  }

  // Mounting logic
  mount() {
    const app = this.App
    if (!app) throw new Error('No app found')
    if (this._rendered) return
    this._instance.render(createElement(app as any))
    this._rendered = true
  }
  unmount() {
    if (!this._rendered) return
    this._instance.unmount()
    this._rendered = false
  }
  toggleMount() {
    this._rendered ? this.unmount() : this.mount()
  }
}
if (!window.customElements.get('x-poshify-utils')) {
  window.customElements.define('x-poshify-utils', XPoshifyUtils)
}
*/

class PoshifyUtilsElement {
  node?: HTMLDivElement
  _ac: null | AbortController
  _showing: boolean
  _instance?: Root
  _rendered: boolean
  App?: () => JSX.Element
  _toggleButton?: {
    li: HTMLLIElement
    anchor: HTMLAnchorElement
  }

  constructor() {
    this._ac = null
    this._showing = false
    this._rendered = false
  }

  connectedCallback() {
    this.node = document.createElement('div')
    ;(this.node as any)._poshify_instance = this
    this._instance = createRoot(this.node)
    this.node.classList.add('x-poshify-utils', 'PoshifyUtils_Root')

    this._ac?.abort()
    this._ac = new AbortController()

    // Toggle on click
    this.node.addEventListener(
      'click',
      ({ target }) => {
        if (target === this.node) {
          console.log('Toggle visiblity on click', { target })
          this.toggleAppVisibility()
        }
      },
      { signal: this._ac.signal }
    )

    this._toggleButton = getSidebarButton()?.()
    if (this._toggleButton) {
      this._toggleButton.li.addEventListener(
        'click',
        () => {
          this.toggleAppVisibility()
        },
        { signal: this._ac.signal }
      )
    }

    this.toggleAppVisibility(false)
  }

  disconnectedCallback() {
    this._ac?.abort()
    this._ac = null
    this._toggleButton?.li.remove()
    this.node = undefined
  }

  toggleAppVisibility(show?: boolean) {
    const nextShowing = show != null ? !!show : !this._showing
    const hidden = !nextShowing
    // Toggle aria-hidden

    this.node?.setAttribute('aria-hidden', hidden.toString())

    this._showing = nextShowing

    // Update hightlited class of sidebar button
    const toggleBtn = this._toggleButton
    if (toggleBtn) {
      const fn = nextShowing ? 'add' : 'remove'
      EL.TOGGLE_BTN.highlightClassses.forEach(c => {
        toggleBtn.anchor.classList[fn]?.(c)
      })
      EL.TOGGLE_BTN.parentHighlightClasses.forEach(c => {
        toggleBtn.anchor.parentElement?.classList[fn]?.(c)
      })
    }
  }

  // Mounting logic
  mount() {
    const app = this.App
    if (!app) throw new Error('No app found')
    if (this._rendered) return

    this.connectedCallback()
    if (this.node) {
      document.body.appendChild(this.node)
      this.node.remove = () => {
        this.node?.parentElement?.removeChild(this.node)
        this.disconnectedCallback()
      }
    }

    this._instance?.render(createElement(app))
    this._rendered = true
  }
  unmount() {
    if (!this._rendered) return
    this._instance?.unmount()
    this._rendered = false
    this.node?.remove()
    this.node = undefined
  }
  toggleMount() {
    this._rendered ? this.unmount() : this.mount()
  }
}

// ---------------------------------------------------------------

/**
 * Find the (left) sidebar of Shopify admin dashboard
 * Clone the first `li` from the sidebar
 * Add the Poshify name / classes
 * return the element and anchor in the `li`
 *
 */
function getSidebarButton():
  | undefined
  | (() => {
      li: HTMLLIElement
      anchor: HTMLAnchorElement
    }) {
  try {
    const sidebarLinks = [...document.querySelectorAll('nav ul li a')]

    const firstAnchor = sidebarLinks.find(anchor => {
      const href = (anchor.getAttribute('href') || '').toLowerCase()
      const text = anchor.textContent?.trim().toLowerCase()

      if (href === '/admin' || text === 'home') {
        return anchor.closest('ul')
      }
    })

    const firstLi = firstAnchor?.closest('li')
    const ul = firstLi?.closest('ul')
    // Oops - no sidebar navigation found
    if (!firstLi || !ul) {
      Logger(
        ' Unable to find the sidebar navigation to append the Poshify Utils button. Consider opening an issue at https://github.com/husseyexplores/poshify-utilities',
        {
          type: 'error',
          metadata: {
            ul,
            sidebarLinks,
          },
        }
      )

      return
    }

    return () => {
      const li = firstLi.cloneNode(true) as HTMLLIElement
      li.setAttribute('role', 'button')

      const anchor = li.querySelector('a')!
      anchor.classList.add(EL.TOGGLE_BTN.id)
      anchor.setAttribute('href', '#')
      const anchorText = anchor.querySelector('a > span')
      if (anchorText) {
        anchorText.textContent = 'Poshify Utils'
      }

      // Remove highted classes
      ;[...anchor.classList].forEach(c => {
        const selected = c.startsWith('Polaris-Navigation__Item--selected')
        const disabled =
          !selected && c.startsWith('Polaris-Navigation__Item--disabled')
        if (selected || disabled) {
          anchor.classList.remove(c)
        }
      })

      const anchorParent = anchor.parentElement
      if (anchorParent) {
        ;[...anchorParent.classList].forEach(c => {
          const selected = EL.TOGGLE_BTN.parentHighlightClasses.some(x =>
            c.startsWith(x)
          )

          if (selected) {
            anchorParent.classList.remove(c)
          }
        })
      }

      const liSvg = li.querySelector('svg')
      if (liSvg) {
        liSvg.outerHTML = AppIconSvg
      }

      ul.appendChild(li)

      return { li, anchor }
    }
  } catch (e) {
    Logger('Error finding the first element', {
      type: 'warn',
      metadata: {
        error: e,
      },
    })
  }
}

// ---------------------------------------------------------------

function waitForElement(selector: string) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      setTimeout(() => {
        resolve(document.querySelector(selector))
      })

      return
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        setTimeout(() => {
          // safety net for shopify
          resolve(document.querySelector(selector))
        }, 1000)
        observer.disconnect()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  })
}

const appElement: { current: null | PoshifyUtilsElement } = { current: null }

function loadApp() {
  if (appElement.current) return

  if (PROD) {
    fetchCsrfTokens()
  }

  // Create the app element and append it to body
  appElement.current = new PoshifyUtilsElement()
  appElement.current.App = App
  appElement.current.mount()
  // document.body.appendChild(appElement)
  if (DEV) {
    appElement.current.toggleAppVisibility(true)
  }
}

Logger('Waiting for element', { type: 'debug' })
waitForElement(
  '#AppFrameNav [class*="Polaris-Navigation__PrimaryNavigation"] ul li a[href]'
).then(() => {
  setTimeout(() => {
    loadApp()
  }, 1000)
})
setTimeout(() => {
  loadApp()
}, 10_000)

const CAN_LOAD = true
/* global chrome */
if (!DEV) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // let msgFrom = sender.tab
    // ? `from a content script: ${sender.tab.url}`
    //   : 'from the extension'

    Logger('Got message from tab', { metadata: request })

    if (!CAN_LOAD) {
      sendResponse({ mounted: false, active: false, detected: CAN_LOAD })
      return true
    }

    if (!appElement.current) {
      sendResponse({
        mounted: false,
        active: false,
        detected: CAN_LOAD,
      })
      return true
    }

    if (hasProp(request, 'get_status')) {
      sendResponse({
        mounted: appElement.current._rendered,
        active: appElement.current._showing,
        detected: CAN_LOAD,
      })
      return true
    }

    if (hasProp(request, 'mount')) {
      appElement.current.toggleMount()
    }

    if (hasProp(request, 'active')) {
      appElement.current.toggleAppVisibility()
    }

    sendResponse({
      mounted: appElement.current._rendered,
      active: appElement.current._showing,
      detected: CAN_LOAD,
    })

    // important to return true!
    return true
  })
}
