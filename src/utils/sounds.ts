import { createAudioPlayer, AudioPlayer } from 'expo-audio';

let waterSound: AudioPlayer | null = null;
let removeSound: AudioPlayer | null = null;
let clearAllSound: AudioPlayer | null = null;
let soundsLoaded = false;
let loadAttempted = false;

// Local sound assets (public domain from Mixkit)
const WATER_DROP_SOUND = require('../../assets/sounds/water-drop.mp3');
const REMOVE_POP_SOUND = require('../../assets/sounds/pop.mp3');
const CLEAR_ALL_SOUND = require('../../assets/sounds/whoosh.mp3');

export async function loadSounds(): Promise<void> {
  // Only attempt to load once
  if (loadAttempted) return;
  loadAttempted = true;

  try {
    const waterPlayer = createAudioPlayer(WATER_DROP_SOUND);
    waterPlayer.loop = false;
    waterPlayer.volume = 0.5;
    waterSound = waterPlayer;

    const removePlayer = createAudioPlayer(REMOVE_POP_SOUND);
    removePlayer.loop = false;
    removePlayer.volume = 0.6;
    removeSound = removePlayer;

    const clearPlayer = createAudioPlayer(CLEAR_ALL_SOUND);
    clearPlayer.loop = false;
    clearPlayer.volume = 0.5;
    clearAllSound = clearPlayer;

    soundsLoaded = true;
  } catch {
    // Silently fail - sounds are optional
    soundsLoaded = false;
  }
}

export async function playWaterSound(): Promise<void> {
  if (!soundsLoaded || !waterSound) return;
  try {
    await waterSound.seekTo(0);
    waterSound.play();
  } catch {
    // Silently fail
  }
}

export async function playRemoveSound(): Promise<void> {
  if (!soundsLoaded || !removeSound) return;
  try {
    await removeSound.seekTo(0);
    removeSound.play();
  } catch {
    // Silently fail
  }
}

export async function playClearAllSound(): Promise<void> {
  if (!soundsLoaded || !clearAllSound) return;
  try {
    await clearAllSound.seekTo(0);
    clearAllSound.play();
  } catch {
    // Silently fail
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
    if (clearAllSound) {
      clearAllSound.remove();
      clearAllSound = null;
    }
    soundsLoaded = false;
  } catch {
    // Silently fail
  }
}
