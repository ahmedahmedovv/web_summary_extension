chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Open the side panel when a new page is loaded
    chrome.sidePanel.open({ tabId });
  }
});

// Also open side panel when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  });
});