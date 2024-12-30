chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getYouTubeTabs") {
    chrome.tabs.query({ url: "*://www.youtube.com/watch?*" }, (tabs) => {
      sendResponse({ tabs });
    });
    return true;
  }
});
