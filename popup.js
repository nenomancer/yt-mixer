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

      // Create the title element
      const titleElement = createElement("h4", ["title"], {}, tab.title);
      tabElement.appendChild(titleElement);

      // Create the controls container
      const controlsContainer = createElement("div", ["controls"]);

      // Create the checkbox input
      const checkbox = createElement("input", ["select"], {
        type: "checkbox",
        "data-id": tab.id,
      });
      controlsContainer.appendChild(checkbox);

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

      // SELECT CHECKBOX:
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          // If there are already 2 selected tabs, remove the last one
          if (selectedTabs.length >= 2) {
            const removedTab = selectedTabs.pop();
            removedTab.querySelector('input[type="checkbox"]').checked = false;
            removedTab.removeAttribute("data-selected");
            removedTab.querySelector('input[type="range"]').disabled = true;
          }

          // Add the current tab to the selectedTabs array
          selectedTabs.push(tabElement);
        } else {
          // If unchecked, remove the tab from selectedTabs
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
      });

      muteButton.addEventListener("click", () => {
        toggleMute(tab.id);
      });

      playPauseButton.addEventListener("click", () => {
        togglePlay(tab.id);
      });

      volumeSlider.addEventListener("input", () => {
        const volume = volumeSlider.value;
        setVolume(tab.id, volume);
        console.log("actually this id: ", tab.id);

        selectedTabs.forEach((tab, index) => {
          if (tabElement === tab || tab.getAttribute("data-selected") == 0)
            return;

          const total = 1.0;

          const otherVolume = total - volume;
          const otherVolumeSlider = tab.querySelector('input[type="range"]');
          otherVolumeSlider.value = otherVolume;
          console.log("otherVolume needs to be: ", otherVolume);
          const otherId = parseInt(tab.getAttribute("data-id"));
          console.log("other id: ", otherId);
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
