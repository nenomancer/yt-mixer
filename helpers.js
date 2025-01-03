export function handleTabs(tabElement, selectedTabs) {
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

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

export function getYouTubeVideoID(url) {
  const urlObj = new URL(url);
  return urlObj.searchParams.get("v");
}

export function getYouTubeThumbnail(videoID, quality = "hqdefault") {
  return `https://img.youtube.com/vi/${videoID}/${quality}.jpg`;
}

export function handleThumbnailClick(
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

export function toggleMute(id, isChecked) {
  if (isChecked) {
    chrome.tabs.sendMessage(id, { action: "muteTrack" });
  } else {
    chrome.tabs.sendMessage(id, { action: "unmuteTrack" });
  }
}

export function setVolume(id, volume, element) {
  if (element) {
    element.setAttribute("data-content", `Volume: ${volume}`);
    element.value = volume;
  }
  chrome.tabs.sendMessage(id, {
    action: "setVolume",
    volume: volume,
  });
}

export function setSpeed(id, speed, element) {
  element.value = speed;
  element.setAttribute("data-content", `Speed: ${element.value}`);
  chrome.tabs.sendMessage(id, { action: "setSpeed", speed });
}

export function setLockedVolume(mainTabElement, selectedTabs, volume) {
  selectedTabs.forEach((tab) => {
    if (mainTabElement === tab) return;

    const total = 1.0;

    const otherVolume = total - volume;
    const otherVolumeSlider = tab.querySelector(".volume");
    otherVolumeSlider.value = otherVolume;
    const otherId = parseInt(tab.getAttribute("data-id"));
    setVolume(otherId, otherVolume, otherVolumeSlider);
  });
}

export function togglePlay(id, isChecked, element) {
  if (isChecked) {
    element.setAttribute("data-playing", true);
    chrome.tabs.sendMessage(id, { action: "setPlaying" });
  } else {
    element.removeAttribute("data-playing");
    chrome.tabs.sendMessage(id, { action: "setPaused" });
  }
}

export function createElement(
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
