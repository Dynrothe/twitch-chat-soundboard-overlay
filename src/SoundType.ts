export type SoundType = {
  name: string;
  trigger_word: string;
  sound: string;
  volume: number;
  chance: string;
  trigger_cooldown: number | null;
  playback_speed: number | null;
  enabled: string;
};
