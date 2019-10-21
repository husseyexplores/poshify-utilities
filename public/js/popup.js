document.addEventListener('DOMContentLoaded', () => {
  let isMounted = false
  let isAppVisible = false

  const notShopifyNotice = document.getElementById('not_shopify')

  const container = document.querySelector('.container')

  const toggleVisibilityBtn = document.getElementById('toggle_visibility')
  const mountAppBtn = document.getElementById('toggle_mount')

  toggleVisibilityBtn.setAttribute('disabled', true)
  mountAppBtn.setAttribute('disabled', true)

  const payload = { getAppStatus: true }

  // Send message to script on load
  sendMessageToContentScript(payload).then(resp => {
    notShopifyNotice.textContent = 'Shopify admin is not detected.'

    // Visibility status
    if (resp && resp.hasOwnProperty('isAppVisible')) {
      isAppVisible = resp.isAppVisible
      if (isAppVisible) {
        toggleVisibilityBtn.querySelector('span').textContent =
          'Hide Poshify App'
      } else {
        toggleVisibilityBtn.querySelector('span').textContent =
          'Show Poshify App'
      }
    }

    // Mount status
    if (resp && resp.hasOwnProperty('isMounted')) {
      isMounted = resp.isMounted
      if (isMounted) {
        mountAppBtn.querySelector('span').textContent = 'Unmount Metafields App'
        toggleVisibilityBtn.removeAttribute('disabled', false)
      } else {
        mountAppBtn.querySelector('span').textContent = 'Mount Metafields App'
      }

      notShopifyNotice.style.display = 'none' // hide the 'not shopify' notice
      container.style.display = 'block' // display buttons

      mountAppBtn.removeAttribute('disabled', false)
    }
  })

  // On Toggle visibility button click
  function onToggleVisibilityClick() {
    toggleVisibilityBtn.setAttribute('disabled', true)

    const payload = { toggleVisibility: true }
    sendMessageToContentScript(payload).then(resp => {
      if (resp && resp.hasOwnProperty('isAppVisible')) {
        isAppVisible = resp.isAppVisible
      }
      window.close()
    })
  }
  // Attach listener
  toggleVisibilityBtn.addEventListener('click', onToggleVisibilityClick)

  // On toggle mount button click
  function onMountBtnClick() {
    toggleVisibilityBtn.setAttribute('disabled', true)
    mountAppBtn.setAttribute('disabled', true)

    const payload = { [isMounted ? 'unmountApp' : 'mountApp']: true }
    sendMessageToContentScript(payload).then(resp => {
      if (resp && resp.hasOwnProperty('isMounted')) {
        isMounted = resp.isMounted
      }
      window.close()
    })
  }
  // Attach listener
  mountAppBtn.addEventListener('click', onMountBtnClick)
})

// Helpers
function getActiveTabId() {
  return new Promise(resolve => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      tabs => {
        const activeTabId = tabs[0].id
        resolve(activeTabId)
      }
    )
  })
}

function sendMessageToContentScript(payload) {
  return new Promise(resolve => {
    getActiveTabId().then(activeTabId => {
      chrome.tabs.sendMessage(activeTabId, payload, response => {
        resolve(response)
      })
    })
  })
}
