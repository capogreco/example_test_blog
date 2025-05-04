import LandingSketch from "@/islands/LandingSketch.tsx"

export default function LandingPage() {
   return (
      <div style={{ position: "relative", width: "100%", height: "100vh" }}>
         <LandingSketch />
         <a 
            href="/blog" 
            style={{ 
               position: "absolute", 
               inset: 0, 
               zIndex: 5,
               display: "block", 
               cursor: "pointer" 
            }}
            onClick={(e) => {
               // Don't navigate if clicking on the theme toggle or audio toggle (or their children)
               const target = e.target as HTMLElement;
               if (target.closest('button[aria-label*="Switch to"]') || 
                   target.closest('button[aria-label*="Turn audio"]')) {
                  e.preventDefault();
               }
            }}
         >
            {/* Transparent overlay */}
         </a>
      </div>
   )
}
