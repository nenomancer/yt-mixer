document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.getElementById("tabs");
  const thumbnailContainer = document.getElementById("thumbnails");
  const lockVolume = document.getElementById("lock-volume");
  const lockPlayPause = document.getElementById("lock-playpause");
  let isDragging = false;

  const selectedTabs = [];
  const selectedThumbnails = [];

  chrome.runtime.sendMessage({ action: "getYouTubeTabs" }, (response) => {
    const tabs = response.tabs;
    if (!tabs || tabs.length === 0) {
      return;
    }

    lockVolume.addEventListener("change", () => {
      // if first selected is playing (get playing state)
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { action: "getPlaying" }, () => {
          const firstTrack = document.querySelector('.tab[data-selected="0"] ');
          const secondTrack = document.querySelector(
            '.tab[data-selected="1"] '
          );

          const firstSlider = firstTrack.querySelector(".volume");
          const secondSlider = secondTrack.querySelector(".volume");

          if (firstTrack && secondTrack) {
            secondSlider.value = firstSlider.value;
            setLockedVolume(firstTrack, selectedTabs, firstSlider.value);
          }
        });
      });
    });

    tabs.forEach((tab) => {
      togglePlay(tab.id, false);
      setVolume(tab.id, 0.5);
      const videoID = getYouTubeVideoID(tab.url);
      const thumbnailURL = getYouTubeThumbnail(videoID);
      const thumbnail = createElement("img", ["thumbnail", "select"], {
        "data-thumb-id": tab.id,
        src: thumbnailURL,
      });
      thumbnailContainer.appendChild(thumbnail);
      const tabElement = createElement("div", ["tab"]);
      tabElement.setAttribute("data-id", tab.id);
      tabElement.tabIndex = 0;

      thumbnail.addEventListener("click", (e) => {
        handleThumbnailClick(
          thumbnail,
          tabElement,
          selectedThumbnails,
          selectedTabs
        );
      });

      // CREATE TIME SLIDER
      chrome.tabs.sendMessage(
        tab.id,
        { action: "getPlaybackInfo" },
        (playbackInfo) => {
          // Create the volume input range
          const volumeSlider = createElement("input", ["volume"], {
            type: "range",
            "data-id": tab.id,
            min: 0,
            max: 1,
            step: 0.005,
            value: playbackInfo.volume,
            "data-content": `Volume: ${playbackInfo.volume}`,
          });

          volumeSlider.addEventListener("click", (event) => {
            if (!event.ctrlKey) return;
            const volume = 0.5;
            volumeSlider.value = volume;
            volumeSlider.setAttribute(
              "data-content",
              `Volume: ${volumeSlider.value}`
            );
            setVolume(tab.id, volume, volumeSlider);

            if (!lockVolume.checked) return;
            setLockedVolume(tabElement, selectedTabs, volume);
          });

          volumeSlider.addEventListener("input", () => {
            const volume = volumeSlider.value;
            setVolume(tab.id, volume, volumeSlider);

            if (!lockVolume.checked) return;
            setLockedVolume(tabElement, selectedTabs, volume);
          });
          controlsContainer.appendChild(volumeSlider);

          // Create the speed slider
          const speedSlider = createElement("input", ["speed"], {
            type: "range",
            "data-id": tab.id,
            min: 0.25,
            max: 1.75,
            step: 0.005,
            value: playbackInfo.speed,
            "data-content": `Speed: ${playbackInfo.speed}`,
          });
          controlsContainer.appendChild(speedSlider);

          speedSlider.addEventListener("click", (event) => {
            if (!event.ctrlKey) return;

            const speed = 1;
            setSpeed(tab.id, speed, speedSlider);
          });

          speedSlider.addEventListener("input", () => {
            setSpeed(tab.id, speedSlider.value, speedSlider);
          });

          const playbackSlider = createElement("input", ["playback-slider"], {
            type: "range",
            min: "0",
            max: playbackInfo.duration,
            value: playbackInfo.currentTime,
            "data-content": `${formatTime(
              playbackInfo.currentTime
            )} / ${formatTime(playbackInfo.duration)}`,
          });

          playbackSlider.addEventListener("input", () => {
            isDragging = true;
            playbackSlider.setAttribute(
              "data-content",
              `${formatTime(playbackSlider.value)} / ${formatTime(
                playbackSlider.max
              )}`
            );
            chrome.tabs.sendMessage(tab.id, {
              action: "seek",
              time: playbackSlider.value,
            });
          });

          playbackSlider.addEventListener("change", () => {
            isDragging = false;
          });

          setInterval(() => {
            if (!isDragging) {
              chrome.tabs.sendMessage(
                tab.id,
                { action: "getPlaybackInfo" },
                (updatedInfo) => {
                  if (updatedInfo && !updatedInfo.error) {
                    playbackSlider.value = updatedInfo.currentTime;
                    playbackSlider.setAttribute(
                      "data-content",
                      `${formatTime(playbackSlider.value)} / ${formatTime(
                        playbackSlider.max
                      )}`
                    );
                  }
                }
              );
            }
          }, 1000);

          controlsContainer.appendChild(playbackSlider);

          return true;
        }
      );

      // Create the controls container
      const controlsContainer = createElement("div", ["controls"]);

      tabElement.addEventListener("click", (e) => {
        if (e.target.classList.contains("select")) {
          handleTabs(tabElement, selectedTabs);
        }
      });

      const title = createElement(
        "h4",
        ["title"],
        {},
        tab.title.replace(/- YouTube$/, "")
      );
      tabElement.appendChild(title);
      // Create the mute button
      const muteCheckbox = createElement("input", ["mute"], {
        type: "checkbox",
        "data-id": tab.id,
        id: `mute-${tab.id}`,
        "data-content": "Mute",
      });

      controlsContainer.appendChild(muteCheckbox);
      // Create the play/pause checkbox

      const playPauseCheckbox = createElement("input", ["playpause"], {
        type: "checkbox",
        id: `playpause-${tab.id}`,
        "data-content": "Play/Pause",
      });
      controlsContainer.appendChild(playPauseCheckbox);

      muteCheckbox.addEventListener("change", () => {
        toggleMute(tab.id, muteCheckbox.checked);
      });

      playPauseCheckbox.addEventListener("change", () => {
        togglePlay(tab.id, playPauseCheckbox.checked);

        if (!lockPlayPause.checked) return;

        selectedTabs.forEach((tab) => {
          if (tabElement === tab) return;

          const otherPlayPauseCheckbox = tab.querySelector(".playpause");
          otherPlayPauseCheckbox.checked = playPauseCheckbox.checked;

          const otherId = parseInt(tab.getAttribute("data-id"));
          togglePlay(otherId, otherPlayPauseCheckbox.checked);
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

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

function getYouTubeVideoID(url) {
  const urlObj = new URL(url);
  return urlObj.searchParams.get("v");
}

function getYouTubeThumbnail(videoID, quality = "hqdefault") {
  return `https://img.youtube.com/vi/${videoID}/${quality}.jpg`;
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

function toggleMute(id, isChecked) {
  if (isChecked) {
    chrome.tabs.sendMessage(id, { action: "muteTrack" });
  } else {
    chrome.tabs.sendMessage(id, { action: "unmuteTrack" });
  }
}

function setVolume(id, volume, element) {
  if (element) {
    element.setAttribute("data-content", `Volume: ${volume}`);
  }
  chrome.tabs.sendMessage(id, {
    action: "setVolume",
    volume: volume,
  });
}

function setSpeed(id, speed, element) {
  element.value = speed;
  element.setAttribute("data-content", `Speed: ${element.value}`);
  chrome.tabs.sendMessage(id, { action: "setSpeed", speed });
}

function setLockedVolume(tabElement, selectedTabs, volume) {
  selectedTabs.forEach((tab) => {
    if (tabElement === tab) return;

    const total = 1.0;

    const otherVolume = total - volume;
    const otherVolumeSlider = tab.querySelector(".volume");
    otherVolumeSlider.value = otherVolume;
    const otherId = parseInt(tab.getAttribute("data-id"));
    setVolume(otherId, otherVolume, otherVolumeSlider);
  });
}

function togglePlay(id, isChecked) {
  if (isChecked) {
    chrome.tabs.sendMessage(id, { action: "setPlaying" });
  } else {
    chrome.tabs.sendMessage(id, { action: "setPaused" });
  }
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
