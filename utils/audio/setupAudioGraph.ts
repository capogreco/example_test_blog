import { AudioGraph } from './types.ts'

/**
 * Creates and initializes the Web Audio API graph for sound synthesis
 */
export async function setupAudioGraph(): Promise<AudioGraph | null> {
  try {
    // Create audio context
    const context = new AudioContext ()
    
    // Add worklet module
    await context.audioWorklet.addModule ("/scripts/worklets/cute_sine.js")
    
    // Create AudioWorkletNode
    const sineNode = new AudioWorkletNode (context, "cute_sine", {
      processorOptions: {
        sample_rate: context.sampleRate
      }
    })
    
    // Create stereo panner for spatial positioning
    const pannerNode = context.createStereoPanner ()
    pannerNode.pan.value = 0 // Center initially
    
    // Create gain node for volume control
    const gainNode = context.createGain();
    gainNode.gain.value = 0.5; // synth volume
    
    // Create tremolo gain node (but don't use it for modulation)
    // We'll use this as a pass-through gain stage only
    const tremoloGain = context.createGain ()
    tremoloGain.gain.value = 1.0 // Fixed gain with no modulation
    
    // Create LFO but don't connect it (just to maintain the API structure)
    const tremoloLFO = context.createOscillator ()
    tremoloLFO.frequency.value = 4.8
    tremoloLFO.start ()
    
    // Create vibrato (frequency modulation) LFO
    const vibratoLFO = context.createOscillator ()
    vibratoLFO.type = 'sine'
    vibratoLFO.frequency.value = 5.2 // 5.2 Hz vibrato    
    vibratoLFO.start();

    const brightLFO = context.createOscillator ()
    brightLFO.type = 'sine'
    brightLFO.frequency.value = 1 / 24 // 0.5 Hz brightness modulation
    brightLFO.start ()

    const brightConstant = context.createConstantSource ()
    brightConstant.offset.value = 0.5 // Modulation depth
    brightConstant.start ()

    const brightGain = context.createGain ()
    brightGain.gain.value = 0.5 // Modulation depth
    brightLFO.connect

    const brightParam = sineNode.parameters.get ("bright")
    if (brightParam) {
      brightLFO.connect (brightGain)
      brightGain.connect (brightParam)
      brightConstant.connect (brightParam)
    }

    const reverbNode = context.createConvolver ()
    const reverbImpulse = await fetch ("/audio/R1NuclearReactorHall.m4a")
    const reverbArrayBuffer = await reverbImpulse.arrayBuffer ()
    const reverbAudioBuffer = await context.decodeAudioData (reverbArrayBuffer)
    reverbNode.buffer = reverbAudioBuffer
    reverbNode.normalize = true

    const reverbGain = context.createGain ()
    reverbGain.gain.value = 0.2

    const volumeNode = context.createGain ()
    volumeNode.gain.value = 0.5 // Set initial volume to 50%
    
    // Set up algorithmic parameters
    const baseFrequency = 220 // A3
    
    // Connect the main audio chain
    sineNode.connect (tremoloGain)
    tremoloGain.connect (pannerNode)
    pannerNode.connect (gainNode)
    gainNode.connect (reverbGain)
    gainNode.connect (volumeNode)

    reverbGain.connect (reverbNode)
    reverbNode.connect (volumeNode)

    volumeNode.connect (context.destination)

    // Set parameters
    const frequency = sineNode.parameters.get ("freq")
    if (frequency) frequency.value = baseFrequency
    
    const amplitude = sineNode.parameters.get ("amp")
    if (amplitude) amplitude.value = 0 // Start silent
    
    const brightness = sineNode.parameters.get ("bright")
    if (brightness) brightness.value = 0.65 // Medium-high brightness
    
    // Return the complete audio graph
    return {
      context,
      sineNode,
      gainNode,
      pannerNode,
      vibratoLFO,
      tremoloLFO,
      tremoloGain
    }
    
  } catch (error) {
    console.error ("Failed to initialize audio graph:", error)
    return null
  }
}

/**
 * Start audio with fade-in
 */
export function startAudio (audioGraph: AudioGraph) {
  const { context, sineNode, tremoloGain } = audioGraph;
  
  if (!context || !sineNode) return;
  
  // Resume context if suspended
  if (context.state === "suspended") {
    context.resume ()
  }
  
  // Set amplitude directly to full value - no fade in
  if (sineNode.parameters.get("amp")) {
    const currentTime = context.currentTime
    sineNode.parameters.get ("amp")!.setValueAtTime (0.25, currentTime) // Set to full value immediately
    
    // Make sure tremolo gain is always set to 1.0 (no effect)
    if (tremoloGain) {
      tremoloGain.gain.setValueAtTime (1.0, currentTime)
    }
  }
}

/**
 * Stop audio with fade-out
 */
export function stopAudio(audioGraph: AudioGraph) {
  const { context, sineNode, tremoloGain } = audioGraph
  
  if (!context || !sineNode) return
  
  if (sineNode.parameters.get("amp")) {
    const currentTime = context.currentTime;
    
    // Keep tremolo gain at 1.0 (no effect)
    if (tremoloGain) {
      tremoloGain.gain.setValueAtTime(1.0, currentTime);
    }
    
    // Then fade out amplitude
    sineNode.parameters.get("amp")!.linearRampToValueAtTime(0, currentTime + 0.3);
  }
}

/**
 * Set up slow panning automation
 */
export function setupPanning(audioGraph: AudioGraph, isPlaying: () => boolean) {
  return setInterval(() => {
    if (audioGraph.pannerNode && 
        audioGraph.context && 
        isPlaying()) {
      const time = audioGraph.context.currentTime;
      const panValue = Math.sin(time * 0.1 * Math.PI * 2) * 0.6; // Slow panning
      audioGraph.pannerNode.pan.value = panValue;
    }
  }, 50); // 20 updates per second
}