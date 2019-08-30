document.addEventListener('DOMContentLoaded', () => {
  let isMounted = false
  const loadAppButton = document.getElementById('mount_app')

  // Get mount status
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    tabs => {
      // Send message to script file
      chrome.tabs.sendMessage(
        tabs[0].id,
        { getMountStatus: true },
        response => {
          if (response && response.hasOwnProperty('isMounted')) {
            isMounted = response.isMounted
            if (isMounted) {
              loadAppButton.querySelector('span').textContent =
                'Unmount Metafields App'
            } else {
              loadAppButton.querySelector('span').textContent =
                'Mount Metafields App'
            }
            loadAppButton.setAttribute('disabled', false)
          }
        }
      )
    }
  )

  loadAppButton.addEventListener('click', () => {
    // Get active tab
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      tabs => {
        // Send message to script file
        chrome.tabs.sendMessage(
          tabs[0].id,
          { [isMounted ? 'unmountApp' : 'mountApp']: true },
          response => {
            loadAppButton.setAttribute('disabled', true)
            if (response && response.hasOwnProperty('isMounted')) {
              isMounted = response.isMounted
            }

            window.close()
          }
        )
      }
    )
  })
})
