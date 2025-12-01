import "./App.css";
import { useRef, useState } from "react";
import { useGetSoundList } from "./useGetSoundList";
import { SoundType } from "./SoundType";
import useTwitchChat from "./useTwitchChat";
import useKickChat from "./useKickChat";

function App() {
  const urlParams = new URLSearchParams(window.location.search);

  const TWITCH_CHANNEL = urlParams.get("channel");
  const ENABLED = urlParams.get("enabled");
  const AUDIO_NAME = urlParams.get("audioname");
  const ALLOW_MODIFIERS = urlParams.get("allowmodifiers");

  let audioCtx: AudioContext | null = null;

  if (!TWITCH_CHANNEL) {
    return (
      <>
        You need to put the Twitch channel in the URL! Example:{" "}
        <a href="https://repo.pogly.gg/chatsoundboard/?channel=bobross">
          https://repo.pogly.gg/chatsoundboard/?channel=bobross
        </a>
      </>
    );
  }

  const [soundList, setSoundList] = useState<SoundType[]>([]);
  const soundCooldown = useRef<string[]>([]);

  useGetSoundList(setSoundList, soundList);

  const getAudioContext = () => {
    if (!audioCtx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AC();
    }
    return audioCtx!;
  };

  const playSoundWithModifiers = async (sound: SoundType, triggerWord: string, modifiers: any) => {
    const src = sound.sound;
    let audioClip = src;
    let volume = sound.volume;

    if (Array.isArray(src)) {
      if (typeof src[0] === "string") {
        audioClip = src[Math.floor(Math.random() * src.length)] as string;
      } else {
        const picked = pickWeightedSound(src);
        audioClip = picked.clip;
        volume = picked.volume;
      }
    }

    const audio = new Audio(decodeURI(audioClip));

    const audioContext = getAudioContext();
    const audioReq = await fetch(decodeURI(audioClip));
    const arrayBuffer = await audioReq.arrayBuffer();
    const audioData = await audioContext.decodeAudioData(arrayBuffer);

    const source = audioContext.createBufferSource();
    source.buffer = audioData;
    source.playbackRate.value = sound.playback_speed || 1;

    if (ALLOW_MODIFIERS === "true") {
      if (modifiers.reverse && !sound.reverse) {
        for (let i = 0; i < audioData.numberOfChannels; i++) {
          const channelData = audioData.getChannelData(i);
          channelData.reverse();
        }
      }

      if (modifiers.speed && !sound.playback_speed) {
        source.playbackRate.value = modifiers.speed;
      }
    }

    const gainNode = audioContext.createGain();
    gainNode.gain.value = Number(volume) || 0.5;

    source.connect(gainNode).connect(audioContext.destination);
    source.start();

    audio.addEventListener("ended", () => {
      try {
        source.disconnect();
        gainNode.disconnect();
      } catch {}
    });

    if (sound.trigger_cooldown) {
      soundCooldown.current.push(sound.trigger_word);
      setTimeout(() => {
        soundCooldown.current = soundCooldown.current.filter((word) => word !== triggerWord);
      }, sound.trigger_cooldown * 1000);
    }
  };

  const playSound = (sound: SoundType, triggerWord: string) => {
    let audioClip = sound.sound;
    const isArray = Array.isArray(audioClip);

    if (isArray) {
      audioClip = audioClip[Math.floor(Math.random() * audioClip.length)];
    }

    const audio = new Audio(decodeURI(audioClip));
    audio.volume = Number(sound.volume) || 0.5;

    audio.play();

    if (!sound.trigger_cooldown) return;

    soundCooldown.current.push(sound.trigger_word);

    setTimeout(() => {
      soundCooldown.current = soundCooldown.current.filter((word) => word !== triggerWord);
    }, sound.trigger_cooldown * 1000);
  };

  useTwitchChat(soundList, soundCooldown, playSound, playSoundWithModifiers);
  useKickChat(soundList, soundCooldown, playSound, playSoundWithModifiers);

  if (soundList.length === 0) {
    return (
      <div style={{ color: `${ENABLED === "true" ? "green" : "red"}` }} className="container">
        <h1 style={{ margin: 0, padding: 0 }}>No sounds loaded</h1>
      </div>
    );
  }

  return (
    <div style={{ color: `${ENABLED === "true" ? "green" : "red"}` }} className="container">
      {soundList.length >= 1 && !AUDIO_NAME ? (
        <h1 style={{ margin: 0, padding: 0 }}>
          {soundList.filter((sound: SoundType) => sound.enabled === "true").length} sounds enabled
        </h1>
      ) : (
        <h1 style={{ margin: 0, padding: 0 }}>{soundList[0].name}</h1>
      )}
    </div>
  );
}

export default App;

function pickWeightedSound(sounds: any) {
  const weights = sounds.map((s: any) => Number(s.chance?.replace("%", "")) || 0);
  const total = weights.reduce((a: any, b: any) => a + b, 0);

  if (total <= 0) return sounds[Math.floor(Math.random() * sounds.length)];

  const roll = Math.random() * total;
  let acc = 0;

  for (let i = 0; i < sounds.length; i++) {
    acc += weights[i];

    if (roll < acc) return sounds[i];
  }

  return sounds[sounds.length - 1];
}
