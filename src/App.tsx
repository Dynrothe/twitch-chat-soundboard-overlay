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

  const playSound = async (sound: SoundType, triggerWord: string) => {
    let audioClip = Array.isArray(sound.sound)
      ? sound.sound[Math.floor(Math.random() * sound.sound.length)]
      : sound.sound;

    const audio = new Audio(decodeURI(audioClip));

    const audioContext = getAudioContext();
    const audioReq = await fetch(decodeURI(audioClip));
    const arrayBuffer = await audioReq.arrayBuffer();
    const audioData = await audioContext.decodeAudioData(arrayBuffer);

    const source = audioContext.createBufferSource();
    source.buffer = audioData;

    source.playbackRate.value = sound.playback_speed || 1;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = Number(sound.volume) || 0.5;

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

  useTwitchChat(soundList, soundCooldown, playSound);
  useKickChat(soundList, soundCooldown, playSound);

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
