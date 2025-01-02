import {
  createElement,
  formatTime,
  getYouTubeThumbnail,
  getYouTubeVideoID,
  handleTabs,
  handleThumbnailClick,
  setLockedVolume,
  setSpeed,
  setVolume,
  toggleMute,
  togglePlay,
} from "./helpers.js";

document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.getElementById("tracks");
  const thumbnailContainer = document.getElementById("thumbnails");
  const lockVolume = document.getElementById("lock-volume");
  const lockPlayPause = document.getElementById("lock-playpause");
  let isDragging = false;
  let isLoadingMode = false;

  const selectedTabs = [];
  const selectedThumbnails = [];
  const keysPressed = {};

  const setupKeyListeners = (tabs) => {
    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      keysPressed[key] = true;

      const isShiftPressed = event.shiftKey;
      const shortcutLoadingMode = isShiftPressed && key === "l";

      if (isLoadingMode) {
        if (shortcutLoadingMode) {
          isLoadingMode = false;
          thumbnailContainer.blur();
        } else if (key >= "1" && key <= tabs.length) {
          const index = Number(key) - 1;
          handleThumbnailClick(
            tabs[index].thumbnail,
            tabs[index].element,
            selectedThumbnails,
            selectedTabs
          );
        }
      } else {
        if (shortcutLoadingMode) {
          isLoadingMode = true;
          thumbnailContainer.focus();
        }
      }
    });

    document.addEventListener("keyup", (event) => {
      keysPressed[event.key.toLowerCase()] = false;
    });
  };

  const syncVolumeSliders = (tabs) => {
    lockVolume.addEventListener("change", () => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { action: "getPlaying" }, () => {
          const firstTrack = document.querySelector('.tab[data-selected="0"]');
          const secondTrack = document.querySelector('.tab[data-selected="1"]');

          if (firstTrack && secondTrack) {
            const firstSlider = firstTrack.querySelector(".volume");
            const secondSlider = secondTrack.querySelector(".volume");
            secondSlider.value = firstSlider.value;
            setLockedVolume(firstTrack, selectedTabs, firstSlider.value);
          }
        });
      });
    });
  };

  const createControls = (tab, playbackInfo) => {
    const controlsContainer = createElement("div", ["controls"]);

    const volumeSlider = createElement("input", ["volume"], {
      type: "range",
      min: 0,
      max: 1,
      step: 0.005,
      value: playbackInfo.volume,
      "data-content": `Volume: ${playbackInfo.volume}`,
    });

    volumeSlider.addEventListener("input", () => {
      const volume = volumeSlider.value;
      setVolume(tab.id, volume, volumeSlider);
      if (lockVolume.checked) {
        setLockedVolume(tab.element, selectedTabs, volume);
      }
    });

    controlsContainer.appendChild(volumeSlider);

    const speedSlider = createElement("input", ["speed"], {
      type: "range",
      min: 0.25,
      max: 1.75,
      step: 0.005,
      value: playbackInfo.speed,
      "data-content": `Speed: ${playbackInfo.speed}`,
    });

    speedSlider.addEventListener("input", () => {
      setSpeed(tab.id, speedSlider.value, speedSlider);
    });

    controlsContainer.appendChild(speedSlider);

    const playbackSlider = createElement("input", ["playback"], {
      type: "range",
      min: "0",
      max: playbackInfo.duration,
      value: playbackInfo.currentTime,
      "data-content": `${formatTime(playbackInfo.currentTime)} / ${formatTime(
        playbackInfo.duration
      )}`,
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

    const muteCheckbox = createElement("input", ["mute"], {
      type: "checkbox",
      id: `mute-${tab.id}`,
    });

    chrome.tabs.sendMessage(tab.id, { action: "getMutedState" }, (isMuted) => {
      muteCheckbox.checked = isMuted;
    });

    muteCheckbox.addEventListener("change", () => {
      toggleMute(tab.id, muteCheckbox.checked, tab.element);
    });

    controlsContainer.appendChild(muteCheckbox);

    const playPauseCheckbox = createElement("input", ["playpause"], {
      type: "checkbox",
      id: `playpause-${tab.id}`,
    });

    chrome.tabs.sendMessage(
      tab.id,
      { action: "getPlayingState" },
      (isPlaying) => {
        playPauseCheckbox.checked = isPlaying;
        togglePlay(tab.id, isPlaying, tab.element);
      }
    );

    playPauseCheckbox.addEventListener("change", () => {
      togglePlay(tab.id, playPauseCheckbox.checked, tab.element);

      if (lockPlayPause.checked) {
        selectedTabs.forEach((selectedTab) => {
          if (tab.element === selectedTab) return;
          const otherPlayPauseCheckbox =
            selectedTab.querySelector(".playpause");
          otherPlayPauseCheckbox.checked = playPauseCheckbox.checked;
          togglePlay(
            parseInt(selectedTab.getAttribute("data-id")),
            playPauseCheckbox.checked,
            selectedTab
          );
        });
      }
    });

    controlsContainer.appendChild(playPauseCheckbox);

    return controlsContainer;
  };

  const setupTabs = (tabs) => {
    tabs.forEach((tab, index) => {
      const videoID = getYouTubeVideoID(tab.url);
      const thumbnailURL = getYouTubeThumbnail(videoID);

      const thumbnail = createElement("div", ["thumbnail", "select"], {
        "data-thumb-id": tab.id,
        "data-order-id": index + 1,
        src: thumbnailURL,
      });
      thumbnail.style.backgroundImage = `url(${thumbnailURL})`;

      const tabElement = createElement("div", ["track"], {
        "data-id": tab.id,
      });

      tabElement.tabIndex = -1;

      thumbnail.addEventListener("click", () => {
        thumbnailContainer.blur();
        handleThumbnailClick(
          thumbnail,
          tabElement,
          selectedThumbnails,
          selectedTabs
        );
      });

      tabElement.addEventListener("click", (e) => {
        if (e.target.classList.contains("select")) {
          handleTabs(tabElement, selectedTabs);
        }
      });

      chrome.tabs.sendMessage(
        tab.id,
        { action: "getPlaybackInfo" },
        (playbackInfo) => {
          const controlsContainer = createControls(tab, playbackInfo);
          tabElement.appendChild(controlsContainer);
        }
      );

      tab.element = tabElement;
      tab.thumbnail = thumbnail;
      thumbnailContainer.appendChild(thumbnail);
      tabsContainer.appendChild(tabElement);
    });
  };

  chrome.runtime.sendMessage({ action: "getYouTubeTabs" }, (response) => {
    const tabs = response.tabs || [];
    if (tabs.length > 0) {
      setupKeyListeners(tabs);
      syncVolumeSliders(tabs);
      setupTabs(tabs);
    }
  });
});
