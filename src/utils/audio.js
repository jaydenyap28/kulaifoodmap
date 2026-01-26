import { Howl } from 'howler';

// Using reliable raw GitHub URLs for sound effects
// Previous (JavaScript30 Hi-hat): 'https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/hihat.wav'
// New (Pop sound): 'https://raw.githubusercontent.com/joshwcomeau/use-sound/master/stories/sounds/pop.mp3'
const SPIN_SOUND_URL = 'https://raw.githubusercontent.com/joshwcomeau/use-sound/master/stories/sounds/pop.mp3';
const WIN_SOUND_URL = 'https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/tink.wav';

const spinSound = new Howl({
  src: [SPIN_SOUND_URL],
  volume: 0.4, // Slightly louder than before (0.3) as pop is softer
  rate: 1.0 // Normal pitch for a natural pop
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
