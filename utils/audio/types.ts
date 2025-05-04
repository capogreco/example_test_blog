// Audio graph interface
export interface AudioGraph {
  context: AudioContext | null;
  sineNode: AudioWorkletNode | null;
  gainNode: GainNode | null;
  pannerNode: StereoPannerNode | null;
  vibratoLFO: OscillatorNode | null;
  tremoloLFO: OscillatorNode | null;
  tremoloGain: GainNode | null;
}

// MIDI to frequency conversion function
export function midiToFreq (midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12)
}
