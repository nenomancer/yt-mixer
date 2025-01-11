# Nenomancer's YouTube DJ Mixer

Welcome to **Nenomancer's YouTube DJ Mixer**, a tool that allows you to mix two YouTube videos, much like a DJ mixer. This tool provides intuitive controls to manipulate video playback, audio volume, and synchronization, bringing the art of mixing to your fingertips.

## Features

- **Dual Video Playback**: Mix and control two YouTube videos simultaneously.
- **Volume Control**: Adjust the volume for each video independently or use the fader for both.
- **Speed Control (RPM)**: Control the playback speed (BPM) of each video to sync up the music.
- **Timeline Scrubbing**: Scrub through each video’s timeline with ease.
- **Play/Pause Synchronization**: Link the play/pause state of both videos with a single button.
- **Inverse-Linking Volume Sliders**: Inverse link volume sliders to act as faders between the two videos.

## How It Works

The extension detects and works with all currently open YouTube tabs in your browser. To use a YouTube video in the mixer:

1. Ensure that the YouTube tabs you want to mix are **open and fully loaded** in your browser before starting the mixer.
2. When you toggle **Loading Mode**, the extension will scan and list all active YouTube tabs for selection.
3. Select the desired video tab(s) to load them into the mixer.

**Note**: If a tab is not open or the video has not finished loading, the extension will not detect it. Make sure your desired videos are ready to go before activating the mixer.

## Controls

### Mouse Controls

- **Volume Sliders**: Use the sliders to adjust the volume for each video. You can also inverse-link the sliders to control the fader between the two videos.
- **BPM**: Drag the BPM sliders for each video to adjust the speed of playback.
- **Timeline Scrubbing**: Click and drag the timeline to scrub through each video.

### Keyboard Shortcuts

#### Volume Shortcuts (`V` Key)

- **V + L**: Inverse-lock the volume sliders for both tracks.
- **V + Scroll**: Modify the volume of both tracks.
- **V + 1 + Scroll**: Modify the volume of the first track.
- **V + 2 + Scroll**: Modify the volume of the second track.

#### Speed (RPM) Shortcuts (`R` Key)

- **R + L**: Lock speed adjustment for both tracks.
- **R + Scroll**: Adjust the speed of both tracks.
- **R + 1 + Scroll**: Adjust the speed of the first track.
- **R + 2 + Scroll**: Adjust the speed of the second track.

#### Playback Shortcuts

- **P**: Play both tracks.
- **1 + P**: Play the first track.
- **2 + P**: Play the second track.
- **L + P**: Lock or unlock the play/pause state of both tracks.

#### Loading Mode Shortcuts

- **Shift + L**: Toggle **Loading Mode** on and off.
- **Loading Mode (Press 1 - [number of tabs array length])**: Press the corresponding number key to load a specific video into the mixer.
- **Hold 1**: Select the first track.
- **Hold 2**: Select the second track.

## Installation

To install **Nenomancer's YouTube DJ Mixer** as a Chrome extension:

1. **Download** the project files and extract them to a folder on your computer.
2. Open **Google Chrome** and go to `chrome://extensions`.
3. Enable **Developer mode** (toggle switch in the top-right corner).
4. Click **Load Unpacked** and select the folder where you extracted the project files.
5. The extension should now appear in your list of installed extensions.

## Usage

1. Open the YouTube tabs you want to use in the mixer and ensure they are fully loaded.
2. Launch the mixer tool by clicking the extension icon in your browser.
3. Toggle **Loading Mode** and select the desired tabs to load them into the mixer.
4. Use the mouse or keyboard shortcuts to adjust volumes, speeds (RPM), or synchronize playback between the two videos.
5. Enjoy mixing your favorite YouTube videos and creating your own DJ sets!

## License

This tool is open-source and free to use. Feel free to modify or redistribute the code as per your needs. Please refer to the LICENSE file for more details.
