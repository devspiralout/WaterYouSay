import { Audio } from 'expo-av';

let waterSound: Audio.Sound | null = null;

// Water drop sound effect URL (public domain)
const WATER_DROP_URL = 'https://assets.mixkit.co/active_storage/sfx/2617/2617-preview.mp3';

export async function loadSounds(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: WATER_DROP_URL },
      { shouldPlay: false, volume: 0.5 }
    );
    waterSound = sound;
  } catch (error) {
    console.log('Error loading sounds:', error);
  }
}

export async function playWaterSound(): Promise<void> {
  try {
    if (waterSound) {
      await waterSound.setPositionAsync(0);
      await waterSound.playAsync();
    }
  } catch (error) {
    console.log('Error playing water sound:', error);
  }
}

export async function unloadSounds(): Promise<void> {
  try {
    if (waterSound) {
      await waterSound.unloadAsync();
      waterSound = null;
    }
  } catch (error) {
    console.log('Error unloading sounds:', error);
  }
}
