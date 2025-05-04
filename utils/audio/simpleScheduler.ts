import { AudioGraph, midiToFreq } from './types.ts'

const notes = [ 
  [ 40, 52, 56, 63, 64 ],
  [ 40, 52, 54, 61, 66 ],
]
// const notes = [ 64 ]
const arpeggioPeriod = 0.6
const portamento = 0.2 // factor of note length

let intervalId: number | null = null
let isActive = false
let noteIndex = 0
let chordIndex = 0

let noteLength = arpeggioPeriod / notes[chordIndex].length

export function startSequence (audioGraph: AudioGraph) {
  if (isActive) return
  
  const { context, sineNode } = audioGraph
  if (!context || !sineNode) return

  const ampParam = sineNode.parameters.get ("amp")
  if (!ampParam) return
  
  const now = context.currentTime

  if (ampParam) {
    ampParam.cancelScheduledValues (now)
    ampParam.setValueAtTime (0.3, now)
  }
  
  intervalId = globalThis.setInterval (
    () => playStep (audioGraph), 
    noteLength * 1000
  )
  
  playStep (audioGraph)
  
  isActive = true
}

export function stopSequence () {
  if (!isActive) return
  
  if (intervalId !== null) {
    globalThis.clearInterval (intervalId)
    intervalId = null
  }
  
  isActive = false
}

function playStep (audioGraph: AudioGraph) {
  const { context, sineNode } = audioGraph
  if (!context || !sineNode) return
  
  // Get audio parameters
  const freqParam   = sineNode.parameters.get ("freq")
  const brightParam = sineNode.parameters.get ("bright")
  
  if (!freqParam || !brightParam) return
  
  const now = context.currentTime

  chordIndex = now % 18 < 9 ? 0 : 1

  noteIndex %= notes[chordIndex].length
  const note = notes[chordIndex][noteIndex++]

  const freq = midiToFreq (note)
  const pTime = now + noteLength * portamento
  freqParam.cancelScheduledValues (now)
  freqParam.setValueAtTime (freqParam.value, now)
  freqParam.exponentialRampToValueAtTime (freq, pTime)
}

export function isSequenceActive(): boolean {
  return isActive
}