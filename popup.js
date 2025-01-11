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
  toggleLockedPlay,
  toggleMute,
  togglePlay,
} from "./helpers.js";

document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.getElementById("tracks");
  const thumbnailContainer = document.getElementById("thumbnails");
  const lockVolume = document.getElementById("lock-volume");
  const lockPlayPause = document.getElementById("lock-playpause");
  let isScrubbingTimeline = false;
  let isLoadingMode = false;

  const selectedTabs = [];
  const selectedThumbnails = [];
  const keysPressed = {};

  chrome.storage.session.get(null, (items) => {
    const observer = new MutationObserver(() => {
      Object.values(items).forEach((value) => {
        const thumbnail = document.querySelector(`[data-thumb-id="${value}"]`);
        const tabElement = document.querySelector(`[data-id="${value}"]`);

        if (thumbnail && tabElement) {
          handleThumbnailClick(
            thumbnail,
            tabElement,
            selectedThumbnails,
            selectedTabs
          );
        }
      });

      // Disconnect observer when all elements are found
      if (
        Object.values(items).every(
          (value) =>
            document.querySelector(`[data-thumb-id="${value}"]`) &&
            document.querySelector(`[data-id="${value}"]`)
        )
      ) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });

  const setupKeyListeners = (tabs, index) => {
    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      keysPressed[key] = true;

      const shortcutLoadingMode = keysPressed["shift"] && keysPressed["l"];
      const shortcutLockVolume = keysPressed["l"] && keysPressed["v"];
      const shortcutLockPlay = keysPressed["l"] && keysPressed["p"];
      const shortcutFirstTrack = keysPressed["1"] || keysPressed["!"];
      const shortcutSecondTrack = keysPressed["2"] || keysPressed["@"];
      const shortcutBothTracks = shortcutFirstTrack && shortcutSecondTrack;

      if (isLoadingMode) {
        if (shortcutLoadingMode) {
          isLoadingMode = false;
          thumbnailContainer.blur();
        } else if (key >= "1" && key <= tabs.length) {
          const tabIndex = Number(key) - 1;
          handleThumbnailClick(
            tabs[tabIndex].thumbnail,
            tabs[tabIndex].element,
            selectedThumbnails,
            selectedTabs
          );
        }
      } else {
        if (keysPressed["v"]) {
          if (shortcutFirstTrack) {
            selectedTabs[0].querySelector(".volume").classList.add("focused");
            selectedTabs[1]
              .querySelector(".volume")
              .classList.remove("focused");
          } else if (shortcutSecondTrack) {
            selectedTabs[1].querySelector(".volume").classList.add("focused");
            selectedTabs[0]
              .querySelector(".volume")
              .classList.remove("focused");
          } else {
            selectedTabs.forEach((tab) => {
              tab.querySelector(".volume").classList.add("focused");
            });
          }
        }
        if (shortcutFirstTrack) {
          selectedTabs[0]?.classList.add("focused");
        } else {
          selectedTabs[0]?.classList.remove("focused");
        }
        if (shortcutSecondTrack) {
          selectedTabs[1]?.classList.add("focused");
        } else {
          selectedTabs[1]?.classList.remove("focused");
        }
        if (shortcutLoadingMode) {
          isLoadingMode = true;
          thumbnailContainer.focus();
        }
        if (shortcutLockVolume) {
          lockVolume.checked = !lockVolume.checked;
        }
        if (shortcutLockPlay) {
          lockPlayPause.checked = !lockPlayPause.checked;
          lockPlayPause.dispatchEvent(new Event("change"));
        }

        if (keysPressed["p"] && shortcutFirstTrack) {
          if (!selectedTabs[0]) return;
          const id = parseInt(selectedTabs[0].getAttribute("data-id"));
          const isPlaying = selectedTabs[0].getAttribute("data-playing");
          selectedTabs[0].querySelector(".playpause").checked = !isPlaying;
          togglePlay(id, !isPlaying, selectedTabs[0]);
        }
        if (keysPressed["p"] && shortcutSecondTrack) {
          if (!selectedTabs[1]) return;
          const id = parseInt(selectedTabs[1].getAttribute("data-id"));
          const isPlaying = selectedTabs[1].getAttribute("data-playing");
          selectedTabs[1].querySelector(".playpause").checked = !isPlaying;
          togglePlay(id, !isPlaying, selectedTabs[1]);
        }
      }
    });

    document.addEventListener("wheel", (event) => {
      if (isLoadingMode) return;
      const normalize = keysPressed["shift"] ? 0.001 : 0.01;
      const value = parseFloat(event.deltaY) * normalize;

      const shortcutFirstTrack = keysPressed["1"] || keysPressed["!"];
      const shortcutSecondTrack = keysPressed["2"] || keysPressed["@"];
      const shortcutBothTracks = shortcutFirstTrack && shortcutSecondTrack;

      let tabsToAdjust;

      if (keysPressed["v"]) {
        if (shortcutBothTracks) {
          tabsToAdjust = selectedTabs;
        } else if (shortcutFirstTrack) {
          tabsToAdjust = [selectedTabs[0]];
        } else if (shortcutSecondTrack) {
          tabsToAdjust = [selectedTabs[1]];
        } else {
          tabsToAdjust = selectedTabs;
        }

        if (lockVolume.checked) {
          setLockedVolume(
            selectedTabs[0],
            selectedTabs,
            selectedTabs[0].querySelector(".volume").value
          );
        }
        tabsToAdjust?.forEach((tab) => {
          if (!tab) return;

          const volumeElement = tab.querySelector(".volume");
          const currentVolume = parseFloat(volumeElement.value);
          const newVolume = currentVolume + value;

          setVolume(
            Number(tab.getAttribute("data-id")),
            newVolume,
            volumeElement
          );
        });
      }

      if (keysPressed["r"]) {
        if (shortcutBothTracks) {
          tabsToAdjust = selectedTabs;
        } else if (shortcutFirstTrack) {
          tabsToAdjust = [selectedTabs[0]];
        } else if (shortcutSecondTrack) {
          tabsToAdjust = [selectedTabs[1]];
        } else {
          tabsToAdjust = selectedTabs;
        }

        tabsToAdjust?.forEach((tab) => {
          if (!tab) return;

          const speedElement = tab.querySelector(".speed");
          const currentSpeed = parseFloat(speedElement.value);
          const newSpeed = currentSpeed + value;

          setSpeed(Number(tab.getAttribute("data-id")), newSpeed, speedElement);
        });
      }
    });

    document.addEventListener("keyup", (event) => {
      keysPressed[event.key.toLowerCase()] = false;

      if (!selectedTabs.length) return;
      selectedTabs.forEach((tab) => {
        tab.classList.remove("focused");
        tab.querySelector(".volume")?.classList.remove("focused");
      });
    });

    thumbnailContainer.addEventListener("blur", () => (isLoadingMode = false));

    chrome.storage.session.get(
      "isVolumeLocked",
      (items) => (lockVolume.checked = items.isVolumeLocked)
    );
    chrome.storage.session.get(
      "isPlayPauseLocked",
      (items) => (lockPlayPause.checked = items.isPlayPauseLocked)
    );
    lockPlayPause.addEventListener("change", () => {
      chrome.storage.session.set({ isPlayPauseLocked: lockPlayPause.checked });
    });
  };

  const syncVolumeSliders = (tabs) => {
    lockVolume.addEventListener("change", () => {
      chrome.storage.session.set({ isVolumeLocked: lockVolume.checked });
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
    controlsContainer.tabIndex = -1;

    const muteCheckbox = createElement("input", ["mute"], {
      type: "checkbox",
      id: `mute-${tab.id}`,
      tabIndex: -1,
    });
    muteCheckbox.checked = playbackInfo?.isMuted || false;

    muteCheckbox.addEventListener("change", () => {
      toggleMute(tab.id, muteCheckbox.checked, tab.element);
    });

    controlsContainer.appendChild(muteCheckbox);

    const playPauseCheckbox = createElement("input", ["playpause"], {
      type: "checkbox",
      id: `playpause-${tab.id}`,
    });
    playPauseCheckbox.checked = playbackInfo?.isPlaying || false;
    togglePlay(tab.id, playPauseCheckbox.checked, tab.element);

    playPauseCheckbox.addEventListener("change", () => {
      togglePlay(tab.id, playPauseCheckbox.checked, tab.element);
      if (lockPlayPause.checked) {
        toggleLockedPlay(tab, playPauseCheckbox, selectedTabs);
      }
    });

    controlsContainer.appendChild(playPauseCheckbox);

    // Placeholder checkbox
    const placeholderCheckbox = createElement("input", [], {
      type: "checkbox",
      id: `temporary-${tab.id}`,
    });
    placeholderCheckbox.checked = false;
    placeholderCheckbox.disabled = true;
    controlsContainer.appendChild(placeholderCheckbox);

    const volumeSlider = createElement("input", ["volume"], {
      type: "range",
      min: 0,
      max: 0.9,
      step: 0.005,
      value: playbackInfo?.volume,
      "data-content": `VOL`,
    });

    volumeSlider.addEventListener("input", () => {
      const volume = volumeSlider.value;
      setVolume(tab.id, volume, volumeSlider);
      if (lockVolume.checked) {
        setLockedVolume(tab.element, selectedTabs, volume);
      }
    });

    tab.volumeSlider = volumeSlider;

    controlsContainer.appendChild(volumeSlider);

    const speedSlider = createElement("input", ["speed"], {
      type: "range",
      min: 0.25,
      max: 1.75,
      step: 0.005,
      value: playbackInfo?.speed,
      "data-content": `RPM`,
    });

    speedSlider.addEventListener("input", () => {
      setSpeed(
        tab.id,
        keysPressed["ctrl"] || keysPressed["meta"] ? 1.0 : speedSlider.value,
        speedSlider
      );
    });

    controlsContainer.appendChild(speedSlider);

    const playbackSlider = createElement("input", ["playback"], {
      type: "range",
      min: "0",
      max: playbackInfo?.duration,
      value: playbackInfo?.currentTime,
      // "data-content": `${formatTime(playbackInfo.currentTime)} / ${formatTime(
      //   playbackInfo.duration
      // )}`,
      "data-content": "SEK",
    });

    playbackSlider.addEventListener("input", () => {
      isScrubbingTimeline = true;
      // playbackSlider.setAttribute(
      //   "data-content",
      //   `${formatTime(playbackSlider.value)} / ${formatTime(
      //     playbackSlider.max
      //   )}`
      // );
      chrome.tabs.sendMessage(tab.id, {
        action: "seek",
        time: playbackSlider.value,
      });
    });

    playbackSlider.addEventListener("change", () => {
      isScrubbingTimeline = false;
    });

    setInterval(() => {
      if (!isScrubbingTimeline) {
        chrome.tabs.sendMessage(
          tab.id,
          { action: "getPlaybackInfo" },
          (updatedInfo) => {
            if (updatedInfo && !updatedInfo.error) {
              playbackSlider.value = updatedInfo.currentTime;
              // playbackSlider.setAttribute(
              //   "data-content",
              //   `${formatTime(playbackSlider.value)} / ${formatTime(
              //     playbackSlider.max
              //   )}`
              // );
            }
          }
        );
      }
    }, 1000);

    controlsContainer.appendChild(playbackSlider);

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
          console.log("playback info: ", playbackInfo);
          const title = createElement("h4", ["title"], {
            "data-content":
              tab.title.replace(/- YouTube$/, "").replace(/^\(\d+\)\s*/, "") +
              " | ",
          });
          tabElement.appendChild(title);
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
