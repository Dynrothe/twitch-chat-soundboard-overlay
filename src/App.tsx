import "./App.css";
import { useRef, useState } from "react";
import { useGetSoundList } from "./useGetSoundList";
import { SoundType } from "./SoundType";
import useTwitchChat from "./useTwitchChat";
import useKickChat from "./useKickChat";

function App() {
  const urlParams = new URLSearchParams(window.location.search);

  // Pass required information to the widget with URL parameters.
  const TWITCH_CHANNEL = urlParams.get("channel");
  const ENABLED = urlParams.get("enabled");
  const AUDIO_NAME = urlParams.get("audioname");

  if (!TWITCH_CHANNEL)
    return (
      <>
        You need to put the twitch channel in the url! example:{" "}
        <a href="https//repo.pogly.gg/chatsoundboard/?channel=bobross">
          https//repo.pogly.gg/chatsoundboard/?channel=bobross
        </a>
        !
      </>
    );

  const [soundList, setSoundList] = useState<SoundType[]>([]);
  const soundCooldown = useRef<string[]>([]);

  useGetSoundList(setSoundList, soundList);

  const playSound = (sound: SoundType, triggerWord: string) => {
    let audioClip = sound.sound;
    const isArray = Array.isArray(audioClip);

    if (isArray) {
      audioClip = audioClip[Math.floor(Math.random() * audioClip.length)];
    }

    const audio = new Audio(decodeURI(audioClip));
    audio.volume = Number(sound.volume) || 0.5;

    if (sound.playback_speed) {
      audio.playbackRate = sound.playback_speed;
    }

    audio.play();

    if (!sound.trigger_cooldown) return;

    soundCooldown.current.push(sound.trigger_word);

    setTimeout(() => {
      soundCooldown.current = soundCooldown.current.filter((word) => word !== triggerWord);
    }, sound.trigger_cooldown * 1000);
  };

  useTwitchChat(soundList, soundCooldown, playSound);
  useKickChat(soundList, soundCooldown, playSound);

  if (soundList.length === 0) {
    return (
      <div
        style={{
          color: `${ENABLED === "true" ? "green" : "red"}`,
        }}
        className="container"
      >
        <h1 style={{ margin: "0", padding: "0" }}>No sounds loaded</h1>
      </div>
    );
  }

  return (
    <div
      style={{
        color: `${ENABLED === "true" ? "green" : "red"}`,
      }}
      className="container"
    >
      {soundList.length >= 1 && !AUDIO_NAME ? (
        <h1 style={{ margin: "0", padding: "0" }}>
          {soundList.filter((sound: SoundType) => sound.enabled === "true").length} sounds enabled
        </h1>
      ) : (
        <h1 style={{ margin: "0", padding: "0" }}>{soundList[0].name}</h1>
      )}
    </div>
  );
}

export default App;
