document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.getElementById("tabs");

  chrome.runtime.sendMessage({ action: "getYouTubeTabs" }, (response) => {
    const tabs = response.tabs;
    if (!tabs || tabs.length === 0) {
      return;
    }
    tabs.forEach((tab) => {
      const tabElement = document.createElement("div");
      tabElement.classList.add("tab");

      tabElement.innerHTML = `
        <div>${tab.title}</div>
        <div class="controls">
            <button data-id="${tab.id}" class="mute">Mute</button>
            <button data-id="${tab.id}"
            class="playpause">Play/Pause</button>
            <input type="range" data-id="${tab.id}" class="volume" min="0" max="1" step="0.1">
        </div>
      `;
      tabsContainer.appendChild(tabElement);
    });

    tabsContainer.addEventListener("click", (e) => {
      button = e.target;
      const tabId = Number(button.dataset.id);

      if (button.classList.contains("mute")) {
        chrome.tabs.sendMessage(tabId, { action: "toggleMute" });
      } else if (button.classList.contains("playpause")) {
        chrome.tabs.sendMessage(tabId, { action: "togglePlayPause" });
      }
    });

    tabsContainer.addEventListener("input", (e) => {
      const slider = e.target;
      const tabId = Number(slider.dataset.id);

      if (slider.classList.contains("volume")) {
        chrome.tabs.sendMessage(tabId, {
          action: "setVolume",
          volume: slider.value,
        });
      }
    });
  });
});
