# Stream Chat Soundboard Overlay

A Pogly widget that plays a specified MP3 when a chosen word is said in chat. Supports Twitch and Kick, single sounds or a full sound list, trigger chances, cooldowns, and playback modifiers.

## Variables

| Variable            | Description                                                                     |
| ------------------- | ------------------------------------------------------------------------------- |
| `channel`           | The channel whose chat the widget listens to                                    |
| `subscribers_only`  | Only allow channel subscribers to trigger sounds (**Twitch only**)              |
| `is_kick_stream`    | Channel is on Kick instead of Twitch                                            |
| `name`              | Name for the sound                                                              |
| `trigger_word`      | The word that triggers the sound effect                                         |
| `chance_to_trigger` | Chance for the sound to trigger (example: `50%`)                                |
| `trigger_cooldown`  | How often the sound can be triggered, in seconds                                |
| `message_contains`  | Trigger word can appear anywhere in the message                                 |
| `audio_url`         | Link to the MP3 file                                                            |
| `volume`            | Volume for the sound                                                            |
| `audio_list_url`    | Raw pastebin URL of a sound list, see [Using a sound list](#using-a-sound-list) |
| `allow_modifiers`   | Allows chat to speed up, slow down, or reverse sounds                           |
| `min_pitch`         | Minimum speed for the speed modifier                                            |
| `max_pitch`         | Maximum speed for the speed modifier                                            |
| `enabled`           | Turns the widget on or off                                                      |

---

## Modifiers

With `allow_modifiers` enabled, viewers can change how a sound plays by adding a modifier after the trigger word:

- `KEKW 50%` -> plays at half speed
- `KEKW reverse` -> plays backwards
- `KEKW reverse 50%` -> both (`KEKW 50% reverse` works too)

Speed is clamped between `min_pitch` and `max_pitch`.

> **Note:** modifiers **do not work** on a sound if `playback_speed` or `reverse` are set on that sound object in the JSON list below.

---

## Using a sound list

If you have a big list of audio cues, you're better off combining them into a JSON array and handing the whole thing to the widget through [pastebin](https://pastebin.com/).

### 1. Build the list

```json
{
  "sounds": [
    {
      "trigger_word": "",
      "sound": "" || ["", "", ""],
      "volume": 1,
      "chance": "100%",
      "trigger_cooldown": 0,
      "playback_speed": 1,
      "reverse": false
    }
  ]
}
```

`sound` accepts either a single URL string or an array of URLs with an array, one is picked at random each time the sound triggers.

New to JSON objects and arrays, or not sure how to fit multiple sounds into the array? [This explanation](https://stackoverflow.com/a/12706643) covers it.

### 2. Paste it and grab the raw URL

Create a pastebin for your list and copy its **raw** URL (the one that looks like `https://pastebin.com/raw/rWd83VQB`, not the regular page URL). Put that in the `audio_list_url` variable.

### 3. Ignore the rest

Setting `audio_list_url` makes every other variable obsolete except `channel`, `message_contains`, and `enabled`. Every sound-related variable can be left empty.

If the list isn't loading, run it through [JSONLint](https://jsonlint.com/) to validate the JSON and find the problem.

## Premade sound lists

Check out a sound list website made by [WindowsBen](https://x.com/WindowsBen1) if you don't want to make one yourself: https://windowsben.github.io/soundlist/
