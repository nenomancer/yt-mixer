chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getYouTubeTabs") {
    chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
      sendResponse({ tabs });
    });
    return true;
  }
});
