document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.getElementById("tabs");
  const selectedTabs = [];

  chrome.runtime.sendMessage({ action: "getYouTubeTabs" }, (response) => {
    const tabs = response.tabs;
    if (!tabs || tabs.length === 0) {
      return;
    }

    tabs.forEach((tab) => {
      const tabElement = document.createElement("div");
      tabElement.classList.add("tab");
      tabElement.setAttribute("data-id", tab.id);
      tabElement.tabIndex = 0;

      // Create the title element
      const titleElement = createElement(
        "h4",
        ["title"],
        {},
        tab.title.replace(/- YouTube$/, "")
      );
      tabElement.appendChild(titleElement);

      // Create the controls container
      const controlsContainer = createElement("div", ["controls"]);

      tabElement.addEventListener("click", (e) => {
        if (e.target.className == "tab" || e.target.className == "title") {
          handleTabs(tabElement, selectedTabs);
        }
      });

      // Create the mute button
      const muteButton = createElement(
        "button",
        ["mute"],
        { "data-id": tab.id },
        "Mute"
      );
      controlsContainer.appendChild(muteButton);

      // Create the play/pause button
      const playPauseButton = createElement(
        "button",
        ["playpause"],
        { "data-id": tab.id },
        "Play/Pause"
      );
      controlsContainer.appendChild(playPauseButton);

      // Create the volume input range
      const volumeSlider = createElement("input", ["volume"], {
        type: "range",
        "data-id": tab.id,
        min: 0,
        max: 1,
        step: 0.005,
        value: 0.5,
        disabled: true,
      });
      controlsContainer.appendChild(volumeSlider);

      muteButton.addEventListener("click", () => {
        toggleMute(tab.id);
      });

      playPauseButton.addEventListener("click", () => {
        togglePlay(tab.id);
      });

      volumeSlider.addEventListener("input", () => {
        const volume = volumeSlider.value;
        setVolume(tab.id, volume);

        selectedTabs.forEach((tab, index) => {
          if (tabElement === tab || tab.getAttribute("data-selected") == 0)
            return;

          const total = 1.0;

          const otherVolume = total - volume;
          const otherVolumeSlider = tab.querySelector('input[type="range"]');
          otherVolumeSlider.value = otherVolume;
          const otherId = parseInt(tab.getAttribute("data-id"));
          setVolume(otherId, otherVolume);
        });
      });

      // Append the controls container to the tab element
      tabElement.appendChild(controlsContainer);

      // Now append tabElement to the tabsContainer
      tabsContainer.appendChild(tabElement);
    });
  });
});

function handleTabs(tabElement, selectedTabs) {
  if (!tabElement.getAttribute("data-selected")) {
    if (selectedTabs.length >= 2) {
      const removedTab = selectedTabs.pop();
      removedTab.removeAttribute("data-selected");
      removedTab.querySelector('input[type="range"]').disabled = true;
    }
    selectedTabs.push(tabElement);
  } else {
    tabElement.removeAttribute("data-selected");
    const index = selectedTabs.indexOf(tabElement);
    if (index !== -1) {
      selectedTabs.splice(index, 1);
    }
  }

  // Update the data-selected attribute on all selected tabs
  selectedTabs.forEach((tab, index) => {
    tab.setAttribute("data-selected", index);
    tab.querySelector('input[type="range"]').disabled = false;
  });
}

function toggleMute(id) {
  chrome.tabs.sendMessage(id, { action: "toggleMute" });
}

function setVolume(id, volume) {
  chrome.tabs.sendMessage(id, {
    action: "setVolume",
    volume: volume,
  });
}

function togglePlay(id) {
  chrome.tabs.sendMessage(id, { action: "togglePlayPause" });
}

function createElement(
  tag,
  classNames = [],
  attributes = {},
  textContent = ""
) {
  const element = document.createElement(tag);
  if (classNames.length) {
    element.classList.add(...classNames);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
}
