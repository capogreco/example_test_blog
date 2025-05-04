import { useEffect, useState, useRef } from "preact/hooks"
import {
  // Types
  AudioGraph,
  
  // Audio setup
  setupAudioGraph,
  startAudio,
  stopAudio,
  
  // Simple Scheduler
  startSequence,
  stopSequence,
  
  // UI
  useThemeDetector
} from "../utils/audio/index.ts"

export default function AudioToggle () {

  // State
  const [ audioState, setAudioState ] = useState <"off" | "on"> ("off")
  const [ mounted, setMounted ] = useState (false)
  const [ initialized, setInitialized ] = useState (false)
  
  // Refs
  const audioGraphRef = useRef <AudioGraph | null> (null)
  const panningIntervalRef = useRef <number | null> (null)
  
  // Theme detection
  const isDarkMode = useThemeDetector (mounted)

  // On mount, get the audio state from localStorage
  useEffect (() => {
    setMounted (true)
  
    // Default to off
    const initialAudioState = "off"
    setAudioState (initialAudioState)    
  }, [])

  // Initialize audio
  const initializeAudio = async () => {
    try {
      if (initialized) return true

      // Set up audio graph
      const graph = await setupAudioGraph ()
      if (!graph) return false
      
      audioGraphRef.current = graph
      
      setInitialized (true)      
      return true

    } catch (error) {
      console.error("Failed to initialize audio:", error)
      return false
    }
  }

  // Toggle audio on/off
  const toggleAudio = async () => {
    const newAudioState = audioState === "off" ? "on" : "off"
    
    if (newAudioState === "on") {
      // Initialize if needed
      if (!initialized) {
        const success = await initializeAudio ()
        if (!success) return // Don't proceed if initialization failed
      }
      
      if (!audioGraphRef.current) return
      
      // Start audio
      startAudio (audioGraphRef.current)
      
      // Start algorithmic composition
      startSequence(audioGraphRef.current);
      
    } else {
      if (!audioGraphRef.current) return;
      
      // Stop audio
      stopAudio (audioGraphRef.current)
      
      // Stop algorithmic composition
      stopSequence ()
    }
    
    // Update state
    setAudioState (newAudioState)
    localStorage.setItem ("audioState", newAudioState)
  };
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Stop sequence if running
      stopSequence();
      
      // Clean up panning interval
      if (panningIntervalRef.current !== null) {
        clearInterval (panningIntervalRef.current)
      }
      
      // Dispose audio context
      if (audioGraphRef.current?.context) {
        audioGraphRef.current.context.close ().catch (console.error)
      }
    }
  }, [])
  

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) return null

  return (
    <button
      onClick={toggleAudio}
      class={`rounded-md p-2 ${isDarkMode ? 'bg-white' : 'bg-black'} hover:opacity-90`}
      aria-label={audioState === "off" ? "Turn audio on" : "Turn audio off"}
    >
      {audioState === "off" ? (
        // Sound muted icon
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={isDarkMode ? "black" : "white"} 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z"></path>
          <path d="m18 12-6-6M18 12l-6 6"></path>
        </svg>
      ) : (
        // Sound on icon
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={isDarkMode ? "black" : "white"} 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      )}
      <span class="sr-only">Toggle audio</span>
    </button>
  )
}