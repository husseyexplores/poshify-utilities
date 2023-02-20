/* global chrome */
document.addEventListener('DOMContentLoaded', () => {
  let hasOwnProp = obj => prop =>
    Object.prototype.hasOwnProperty.call(obj, prop)

  // Elements
  const notShopifyNotice = document.getElementById('not_shopify')
  const container = document.querySelector('.container')
  const toggleVisibilityBtn = document.getElementById('toggle_visibility')
  const toggleMountBtn = document.getElementById('toggle_mount')
  notShopifyNotice.textContent = 'Shopify admin is not detected.'

  let state = {
    mounted: writable(false),
    active: writable(false),
    detected: writable(false),
  }

  function updateAllStates(newStateObj) {
    if (newStateObj) {
      Object.keys(newStateObj).forEach(key => {
        let store = state[key]
        let nextValue = newStateObj[key]

        if (store && store.set) {
          store.set(nextValue)
        }
      })
    }
  }

  state.detected.subscribe(_detected => {
    if (_detected) {
      notShopifyNotice.style.display = 'none'
      container.style.display = 'block'
      toggleMountBtn.removeAttribute('disabled')
    }
  })

  state.active.subscribe(_active => {
    toggleVisibilityBtn.querySelector('span').textContent = _active
      ? 'Hide Poshify App'
      : 'Show Poshify App'
  })

  state.mounted.subscribe(_mount => {
    toggleMountBtn.querySelector('span').textContent = _mount
      ? 'Unmount Poshify App'
      : 'Mount Poshify App'

    if (_mount) {
      toggleVisibilityBtn.removeAttribute('disabled')
    } else {
      toggleVisibilityBtn.setAttribute('disabled', 'true')
    }
  })

  // Send message to script on load
  sendMessageToContentScript({ get_status: true }).then(updateAllStates)

  // Visibility listener
  toggleVisibilityBtn.addEventListener('click', e => {
    sendMessageToContentScript({ active: !state.active.value }).then(
      updateAllStates
    )
  })

  // Toggle listener
  toggleMountBtn.addEventListener('click', e => {
    sendMessageToContentScript({ mount: !state.mounted.value }).then(
      updateAllStates
    )
  })
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

// ---------------------------------------------------------------

/*
 * Basic svelte store implementation
 *
 */
const noop = () => {}
function safe_not_equal(a, b) {
  return a != a
    ? b == b
    : a !== b || (a && typeof a === 'object') || typeof a === 'function'
}

const subscriber_queue = []
function writable(value, start = noop) {
  let stop
  const subscribers = new Set()

  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value

      // store is ready?
      if (stop) {
        const run_queue = !subscriber_queue.length
        for (const subscriber of subscribers) {
          subscriber[1]() // Call invalidate
          subscriber_queue.push(subscriber, value)
        }

        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1])
          }
          subscriber_queue.length = 0
        }
      }
    }
  }

  function update(fn) {
    set(fn(value))
  }

  function subscribe(run, invalidate = noop) {
    const subscriber = [run, invalidate]
    subscribers.add(subscriber)
    if (subscribers.size === 1) {
      stop = start(set) || noop
    }
    run(value)

    return () => {
      subscribers.delete(subscriber)
      if (subscribers.size === 0) {
        stop()
        stop = null
      }
    }
  }
  return {
    set,
    update,
    subscribe,
    get value() {
      return value
    },
  }
}
