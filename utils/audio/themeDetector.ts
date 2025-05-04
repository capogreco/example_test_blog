import { useEffect, useState } from "preact/hooks";

/**
 * Hook to detect and track dark mode changes
 */
export function useThemeDetector(mounted: boolean) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    if (!mounted) return;
    
    // Initial check
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    // Check on mount
    checkDarkMode();
    
    // Set up observer to detect theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' && 
          mutation.attributeName === 'class'
        ) {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Cleanup
    return () => observer.disconnect();
  }, [mounted]);
  
  return isDarkMode;
}