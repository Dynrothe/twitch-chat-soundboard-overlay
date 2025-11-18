import { useEffect, useRef, useState } from "react";
import { SoundType } from "./SoundType";

const WS_URL = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false";

export default function useKickChat(soundList: SoundType[], soundCooldown: any, playSound: Function) {
  const urlParams = new URLSearchParams(window.location.search);

  const TWITCH_CHANNEL = urlParams.get("channel");
  const MESSAGE_CONTAINS = urlParams.get("messagecontains");
  const ENABLED = urlParams.get("enabled");
  const KICK = urlParams.get("kick");
  const MINIMUM_PITCH = urlParams.get("minpitch");
  const MAX_PITCH = urlParams.get("maxpitch");

  const [connected, setConnected] = useState(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  const listOfTriggerWords = new Set<string>();

  useEffect(() => {
    if (!TWITCH_CHANNEL || connected || initialized || ENABLED === "false" || KICK !== "true") return;
    if (soundList.length === 0) return;

    setInitialized(true);

    soundList.forEach((sound: SoundType) => listOfTriggerWords.add(sound.trigger_word));

    const twitchChannel: string = TWITCH_CHANNEL.toLowerCase();
    let closedByEffect = false;

    (async () => {
      const channelName = await getChannelRoomID(twitchChannel);
      if (!channelName) return console.error("Could not get Kick channel ID.");

      console.log("Attempting to establish connection...");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        setConnected(true);
        const subscribeFrame = JSON.stringify({
          event: "pusher:subscribe",
          data: { auth: "", channel: channelName },
        });
        ws.send(subscribeFrame);

        console.log("Connected to Kick chat");
      });

      ws.addEventListener("message", (ev) => {
        try {
          const parsed = JSON.parse(ev.data as string);
          if (parsed && !parsed.event.includes("ChatMessageEvent")) return;

          let message = JSON.parse(parsed.data).content;

          if (/[\uDB40\uDC00-\uDC7F]/.test(message)) {
            message = message.replace(/\uDB40[\uDC00-\uDC7F]/g, "").trimEnd();
          }

          let triggerWord: string | null = null;

          if (MESSAGE_CONTAINS === "true") {
            const words = message.split(/\s+/);

            words.some((word: string) => {
              let cleanedWord = "";

              if (word.startsWith("[") && word.endsWith("]")) {
                cleanedWord = word.split(":").pop()?.replace("]", "") || "";
              }

              if (listOfTriggerWords.has(cleanedWord)) {
                triggerWord = cleanedWord;
              }
            });
          } else {
            const words = message.split(/\s+/);

            if (words[0].startsWith("[") && words[0].endsWith("]")) {
              words[0] = words[0].split(":").pop()?.replace("]", "");
            }

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
          const modifiers = handleModifiers(args, MINIMUM_PITCH, MAX_PITCH);

          playSound(sound, triggerWord, modifiers);
        } catch {
          // Do nothing
        }
      });

      ws.addEventListener("error", (err) => {
        console.error("WEBSOCKET ERROR", err);
      });

      ws.addEventListener("close", (ev) => {
        setConnected(false);
        console.log(
          `DISCONNECTED: code ${ev.code}, message "${ev.reason || "unkown"}" ${closedByEffect ? " (cleanup)" : ""}`
        );
      });
    })();

    return () => {
      closedByEffect = true;
      const ws = wsRef.current;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        try {
          ws.close(1000, "Unmounting");
        } catch {
          // Do nothing
        }
      }
      wsRef.current = null;
    };
  }, [soundList]);
}
const getChannelRoomID = async (channel: string) => {
  console.log("Fetching Kick channel ID...");
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${channel}/chatroom`);
    if (!res.ok) return null;
    const json = await res.json();
    return `chatrooms.${json.id}.v2`;
  } catch (e) {
    console.error("FAILED TO GET CHANNEL ID", e);
    return null;
  }
};

function handleModifiers(args: any, minpitch: any, maxpitch: any) {
  const arg1 = args[1]?.toLowerCase();
  const arg2 = args[2]?.toLowerCase();

  const reverse = arg1 === "reverse" || arg2 === "reverse";

  const percentRegex = /^\d+%$/;
  let percentArg = [arg1, arg2].find((a) => percentRegex.test(a));

  // I'm lazy :)
  if (percentArg && minpitch) {
    if (parseFloat(percentArg) < parseFloat(minpitch)) {
      percentArg = parseFloat(minpitch);
    }
  }

  if (percentArg && maxpitch) {
    if (parseFloat(percentArg) > parseFloat(maxpitch)) {
      percentArg = parseFloat(maxpitch);
    }
  }
  const speed = percentArg ? (parseFloat(percentArg) / 100).toFixed(1) : null;

  return {
    reverse,
    speed,
  };
}
