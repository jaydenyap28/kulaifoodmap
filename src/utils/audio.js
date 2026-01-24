import { Howl } from 'howler';

// Using reliable raw GitHub URLs for sound effects (JavaScript30 Drum Kit)
const SPIN_SOUND_URL = 'https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/hihat.wav';
const WIN_SOUND_URL = 'https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/tink.wav';

const spinSound = new Howl({
  src: [SPIN_SOUND_URL],
  volume: 0.3,
  rate: 1.5 // Faster pitch for a "tick" sound
});

const winSound = new Howl({
  src: [WIN_SOUND_URL],
  volume: 0.8,
  rate: 0.8 // Lower pitch for a "chime" effect
});

export const playSpinSound = () => {
  spinSound.stop(); // Stop overlap
  spinSound.play();
};

export const playWinSound = () => {
  winSound.stop();
  winSound.play();
};
