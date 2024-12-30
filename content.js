chrome.runtime.onMessage.addListener((message) => {
  const video = document.querySelector("video");
  if (!video) return;

  switch (message.action) {
    case "muteTrack":
      video.muted = true;
      break;
    case "unmuteTrack":
      video.muted = false;
      break;

    case "setPlaying": {
      video.play();
      break;
    }
    case "setPaused": {
      video.pause();
      break;
    }
    case "setVolume":
      video.volume = parseFloat(message.volume);
      break;
    case "setSpeed":
      video.playbackRate = parseFloat(message.speed);
  }
});
