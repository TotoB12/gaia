// Handle extension installation/update
chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .catch(error => console.error(error));
  });
  
  // Listen for messages from sidebar if needed
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Add message handling logic here later
  });