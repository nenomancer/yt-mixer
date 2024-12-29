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
        step: 0.05,
        value: 0.5,
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
        });
      });

      muteButton.addEventListener("click", () => {
        chrome.tabs.sendMessage(tab.id, { action: "toggleMute" });
        if (muteButton.checked) {
        }
      });

      playPauseButton.addEventListener("click", () => {
        chrome.tabs.sendMessage(tab.id, { action: "togglePlayPause" });
      });

      volumeSlider.addEventListener("input", () => {
        chrome.tabs.sendMessage(tab.id, {
          action: "setVolume",
          volume: volumeSlider.value,
        });
      });

      // Append the controls container to the tab element
      tabElement.appendChild(controlsContainer);

      // Now append tabElement to the tabsContainer
      tabsContainer.appendChild(tabElement);
    });
  });
});

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
