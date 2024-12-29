chrome.runtime.onMessage.addListener((message) => {
  const video = document.querySelector("video");
  if (!video) return;

  switch (message.action) {
    case "toggleMute":
      video.muted = !video.muted;
      break;
    case "togglePlayPause":
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
      break;
    case "setVolume":
      video.volume = parseFloat(message.volume);
      break;
    case "setSpeed":
      video.playbackRate = parseFloat(message.speed);
  }
});
