document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.getElementById("tabs");
  const thumbnailContainer = document.getElementById("thumbnails");
  const lockVolume = document.getElementById("lock-volume");

  const selectedTabs = [];
  const selectedThumbnails = [];

  function getYouTubeVideoID(url) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("v");
  }

  function getYouTubeThumbnail(videoID, quality = "hqdefault") {
    return `https://img.youtube.com/vi/${videoID}/${quality}.jpg`;
  }

  chrome.runtime.sendMessage({ action: "getYouTubeTabs" }, (response) => {
    const tabs = response.tabs;
    if (!tabs || tabs.length === 0) {
      return;
    }

    tabs.forEach((tab) => {
      const videoID = getYouTubeVideoID(tab.url);
      const thumbnailURL = getYouTubeThumbnail(videoID);
      const thumbnail = createElement("img", ["thumbnail", "select"], {
        "data-thumb-id": tab.id,
        src: thumbnailURL,
      });
      thumbnailContainer.appendChild(thumbnail);
      const tabElement = createElement("div", ["tab", "select"]);
      tabElement.setAttribute("data-id", tab.id);
      tabElement.tabIndex = 0;

      thumbnail.addEventListener("click", (e) => {
        console.log("thumbnail clicked");
        handleThumbnailClick(
          thumbnail,
          tabElement,
          selectedThumbnails,
          selectedTabs
        );
      });

      // Create the controls container
      const controlsContainer = createElement("div", ["controls"]);

      tabElement.addEventListener("click", (e) => {
        if (e.target.classList.contains("select")) {
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
      const speedSlider = createElement("input", ["speed"], {
        type: "range",
        "data-id": tab.id,
        min: 0.25,
        max: 2,
        step: 0.005,
        value: 1,
      });
      controlsContainer.appendChild(speedSlider);

      muteButton.addEventListener("click", () => {
        toggleMute(tab.id);
      });

      playPauseButton.addEventListener("click", () => {
        togglePlay(tab.id);
      });

      volumeSlider.addEventListener("input", () => {
        const volume = volumeSlider.value;
        setVolume(tab.id, volume);

        if (!lockVolume.checked) return;

        selectedTabs.forEach((tab, index) => {
          if (tabElement === tab) return;

          const total = 1.0;

          const otherVolume = total - volume;
          const otherVolumeSlider = tab.querySelector('input[type="range"]');
          otherVolumeSlider.value = otherVolume;
          const otherId = parseInt(tab.getAttribute("data-id"));
          setVolume(otherId, otherVolume);
        });
      });

      speedSlider.addEventListener("input", () => {
        const speed = speedSlider.value;
        chrome.tabs.sendMessage(tab.id, { action: "setSpeed", speed });
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
    tabElement.querySelector('input[type="range"]').disabled = true;

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

function handleThumbnailClick(
  thumbnail,
  tabElement,
  selectedThumbnails,
  selectedTabs
) {
  if (!tabElement.getAttribute("data-selected")) {
    if (selectedTabs.length >= 2) {
      const removedThumbnail = selectedThumbnails.pop();
      removedThumbnail.removeAttribute("data-selected");

      const removedTab = selectedTabs.pop();
      removedTab.removeAttribute("data-selected");
      removedTab.querySelector('input[type="range"]').disabled = true;
    }
    selectedTabs.push(tabElement);
    selectedThumbnails.push(thumbnail);
  } else {
    thumbnail.removeAttribute("data-selected");

    tabElement.removeAttribute("data-selected");
    tabElement.querySelector('input[type="range"]').disabled = true;
    const thumbIndex = selectedThumbnails.indexOf(thumbnail);
    if (thumbIndex !== -1) {
      selectedThumbnails.splice(thumbIndex, 1);
    }

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

  selectedThumbnails.forEach((thumbnail, index) => {
    thumbnail.setAttribute("data-selected", index);
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
