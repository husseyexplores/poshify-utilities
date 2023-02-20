/* global chrome */

// trigger when clicking the extension logo
chrome.action.onClicked.addListener(tab => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { toggleVisible: true })
  }
})
