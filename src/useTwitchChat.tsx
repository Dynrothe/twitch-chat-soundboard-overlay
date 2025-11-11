import { useEffect, useState } from "react";
import * as tmi from "tmi.js";
import { SoundType } from "./SoundType";

const useTwitchChat = (soundList: SoundType[], soundCooldown: any, playSound: Function) => {
  const urlParams = new URLSearchParams(window.location.search);

  const TWITCH_CHANNEL = urlParams.get("channel");
  const MESSAGE_CONTAINS = urlParams.get("messagecontains");
  const ENABLED = urlParams.get("enabled");
  const KICK = urlParams.get("kick");

  const ZERO_WIDTH_REGEX = /[\u200B\u200C\u200D\uFEFF\u2060\u180E]/g;

  const [initialized, setInitialized] = useState<boolean>(false);
  const listOfTriggerWords = new Set<string>();

  useEffect(() => {
    if (!TWITCH_CHANNEL || ENABLED === "false" || initialized || KICK === "true") return;
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

      if (ZERO_WIDTH_REGEX.test(message)) {
        message = message.replace(ZERO_WIDTH_REGEX, "");
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
        const words = message.split(/\s+/);
        if (listOfTriggerWords.has(words[0])) {
          triggerWord = words[0];
        }
      }

      if (!triggerWord || soundCooldown.current.includes(triggerWord)) return;

      const sound: SoundType = soundList.find((s: SoundType) => s.trigger_word === triggerWord)!;
      if (!sound || sound.enabled === "false") return;

      const roll = Math.random() * 100 < Number(sound.chance.replace("%", ""));
      if (!roll) return;

      const args = message.split(/\s+/);
      const modifiers = handleModifiers(args);

      playSound(sound, triggerWord, modifiers);
    });
  }, [soundList]);
};

export default useTwitchChat;

function handleModifiers(args: any) {
  const arg1 = args[1]?.toLowerCase();
  const arg2 = args[2]?.toLowerCase();

  const reverse = arg1 === "reverse" || arg2 === "reverse";

  const percentRegex = /^\d+%$/;
  const percentArg = [arg1, arg2].find((a) => percentRegex.test(a));

  const speed = percentArg ? (parseFloat(percentArg) / 100).toFixed(1) : null;

  return {
    reverse,
    speed,
  };
}
