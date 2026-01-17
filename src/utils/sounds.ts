import { createAudioPlayer, AudioPlayer } from 'expo-audio';

let waterSound: AudioPlayer | null = null;
let removeSound: AudioPlayer | null = null;

// Gentle water bubble sound effect (public domain from Mixkit)
const WATER_DROP_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';
// Click sound for removal (public domain from Mixkit)
const REMOVE_POP_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';

export async function loadSounds(): Promise<void> {
  try {
    const waterPlayer = createAudioPlayer(WATER_DROP_URL);
    waterPlayer.loop = false;
    waterPlayer.volume = 0.5;
    waterSound = waterPlayer;

    const removePlayer = createAudioPlayer(REMOVE_POP_URL);
    removePlayer.loop = false;
    removePlayer.volume = 0.8;
    removeSound = removePlayer;
  } catch (error) {
    console.log('Error loading sounds:', error);
  }
}

export async function playWaterSound(): Promise<void> {
  try {
    if (waterSound) {
      await waterSound.seekTo(0);
      waterSound.play();
    }
  } catch (error) {
    console.log('Error playing water sound:', error);
  }
}

export async function playRemoveSound(): Promise<void> {
  try {
    if (removeSound) {
      await removeSound.seekTo(0);
      removeSound.play();
    }
  } catch (error) {
    console.log('Error playing remove sound:', error);
  }
}

export async function unloadSounds(): Promise<void> {
  try {
    if (waterSound) {
      waterSound.remove();
      waterSound = null;
    }
    if (removeSound) {
      removeSound.remove();
      removeSound = null;
    }
  } catch (error) {
    console.log('Error unloading sounds:', error);
  }
}
