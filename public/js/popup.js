document.addEventListener('DOMContentLoaded', () => {
  const loadAppButton = document.getElementById('load_app')

  loadAppButton.addEventListener('click', () => {
    // Get active tab
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      tabs => {
        // Send message to script file
        chrome.tabs.sendMessage(tabs[0].id, { loadApp: true }, response => {
          console.log(response)
          loadAppButton.setAttribute('disabled', true)
          window.close()
        })
      }
    )
  })
})
