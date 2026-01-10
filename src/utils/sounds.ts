import { createAudioPlayer, AudioPlayer } from 'expo-audio';

let waterSound: AudioPlayer | null = null;

// Gentle water bubble sound effect (public domain from Mixkit)
const WATER_DROP_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

export async function loadSounds(): Promise<void> {
  try {
    const player = createAudioPlayer(WATER_DROP_URL, {
      volume: 0.5,
    });
    player.loop = false;
    waterSound = player;
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

export async function unloadSounds(): Promise<void> {
  try {
    if (waterSound) {
      waterSound.remove();
      waterSound = null;
    }
  } catch (error) {
    console.log('Error unloading sounds:', error);
  }
}
