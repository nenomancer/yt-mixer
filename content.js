chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    case "getPlaying": {
      sendResponse({
        isPlaying: !video.paused,
      });
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
      break;
    case "getPlaybackInfo":
      sendResponse({
        currentTime: video.currentTime,
        duration: video.duration,
        title: document.title,
        volume: video.volume,
        speed: video.playbackRate,
      });
      break;
    case "getMutedState":
      sendResponse(video.muted);
    case "getPlayingState":
      sendResponse(!video.paused);
    case "seek":
      video.currentTime = parseFloat(message.time);
      sendResponse({ success: true });
      break;
  }
});
