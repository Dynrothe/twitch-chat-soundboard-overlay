import { useEffect, useState } from "react";
import * as tmi from "tmi.js";
import { SoundType } from "./SoundType";

const useTwitchChat = (soundList: SoundType[], soundCooldown: any, playSound: Function) => {
  const urlParams = new URLSearchParams(window.location.search);

  const TWITCH_CHANNEL = urlParams.get("channel");
  const MESSAGE_CONTAINS = urlParams.get("messagecontains");
  const ENABLED = urlParams.get("enabled");
  const KICK = urlParams.get("kick");

  const [initialized, setInitialized] = useState<boolean>(false);
  const listOfTriggerWords = new Set<string>();

  useEffect(() => {
    if (!TWITCH_CHANNEL || !ENABLED || initialized || KICK === "true") return;
    if (soundList.length === 0) return;

    setInitialized(true);

    soundList.forEach((sound: SoundType) => listOfTriggerWords.add(sound.trigger_word));

    const twitchChannel: string = TWITCH_CHANNEL.toLowerCase();

    const twitchClient = tmi.Client({
      connection: {
        reconnect: true,
        maxReconnectAttempts: Infinity,
        maxReconnectInterval: 30000,
        reconnectDecay: 1.4,
        reconnectInterval: 5000,
        timeout: 180000,
      },
      channels: [twitchChannel],
    });

    twitchClient.connect();

    twitchClient.on("connected", () => {
      console.log("Connected to twitch chat!");
    });

    // Code to grab messages from Twitch chat.
    twitchClient.on("message", (_channel: string, tags: tmi.ChatUserstate, message: string) => {
      if (!tags) return;

      if (/[\u0020\uDBC0]/.test(message)) {
        message = message.slice(0, -3);
      }

      let triggerWord: string | null = null;

      if (MESSAGE_CONTAINS === "true") {
        const words = message.split(/\s+/);

        words.some((word: string) => {
          if (listOfTriggerWords.has(word)) {
            triggerWord = word;
          }
        });
      } else {
        if (listOfTriggerWords.has(message)) {
          triggerWord = message;
        }
      }

      if (!triggerWord || soundCooldown.current.includes(triggerWord)) return;

      const sound: SoundType = soundList.find((s: SoundType) => s.trigger_word === triggerWord)!;
      if (!sound || sound.enabled === "false") return;

      const roll = Math.random() * 100 < Number(sound.chance.replace("%", ""));
      if (!roll) return;

      playSound(sound, triggerWord);
    });
  }, [soundList]);
};

export default useTwitchChat;
