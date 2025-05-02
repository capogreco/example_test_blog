import { useEffect, useRef } from "preact/hooks"
import ThemeToggle from "@/islands/ThemeToggle.tsx"

class SinuSquare {
   private x_speed: number = 0
   private y_rate: number = 0
   private y_phase_offset: number = 0
   private x_phase_offset: number = 0
   private size: number = 0

   constructor (
      x_speed: number, 
      y_rate : number, 
      x_phase : number,
      y_phase : number 
   ) {
      this.x_speed        = x_speed
      this.y_rate         = y_rate
      this.x_phase_offset = x_phase
      this.y_phase_offset = y_phase
      this.size           = 20
   }

   draw (
      ctx: CanvasRenderingContext2D, 
      t  : number,
      col: string,
   ) {
      if (!ctx) return
      const cnv = ctx.canvas

      const x_phase = (t * this.x_speed + this.x_phase_offset) % 1
      const x_pos = (cnv.width + this.size) * x_phase - this.size

      const y_phase = (t * this.y_rate * Math.PI * 2 + this.y_phase_offset) % 1
      const y_sig = Math.sin (y_phase * Math.PI * 2)
      const y_wid = cnv.height / 3
      const y_pos = (cnv.height / 2) - (this.size / 2) + y_sig * y_wid 

      ctx.fillStyle = col
      ctx.fillRect (x_pos, y_pos, this.size, this.size)
   }
}

export default function LandingSketch() {
   const canvasRef = useRef <HTMLCanvasElement> (null)   

   useEffect (() => {
      const cnv = canvasRef.current
      if (!cnv) return

      const resizeCanvas = () => {
         cnv.width = innerWidth
         cnv.height = innerHeight
      };

      resizeCanvas ()
      globalThis.onresize = resizeCanvas

      // Initialize animation
      const initAnimation = async () => {
         const ctx = cnv.getContext ("2d")
         if (!ctx) return

         // Load custom font
         try {
            const font = new FontFace (
               `Clarity_City`,
               `url(/fonts/Clarity_City/ClarityCity-Black.woff2)`,
               { weight: '900', style: 'normal' }
            )
            await font.load ()
            document.fonts.add (font)
         } catch (e) {
            console.error ("Font loading failed:", e)
         }

         // Create squares 
         const x_speed = 0.05
         const y_rate  = 0.01
         
         // Create regular squares
         const numSquares = 36;
         const squares: SinuSquare [] = []
         for (let i = 0; i < numSquares; i++) {
            const phase = i / numSquares
            const offset = (i % 3) / 3
            const y_phase = phase + offset
            squares.push (new SinuSquare (x_speed, y_rate, phase, y_phase))
         }
                  
         const drawFrame = (ms: number) => {

            const bgColour = getComputedStyle (document.documentElement)
               .getPropertyValue ('--color-background').trim ()

            const fgColour = getComputedStyle(document.documentElement)
               .getPropertyValue ('--color-foreground').trim ()

            const accentColour = getComputedStyle (document.documentElement)
               .getPropertyValue ('--color-primary').trim ()
            
            ctx.fillStyle = bgColour
            ctx.fillRect(0, 0, cnv.width, cnv.height)

            const t = ms / 1000
            
            squares.forEach ((s, i) => {
               const col = i === 0 ? accentColour : fgColour
               s.draw (ctx, t, col)
            })

            ctx.fillStyle    = fgColour
            ctx.font         = `bold 20px sans-serif`
            ctx.textAlign    = `center`
            ctx.textBaseline = `middle`
            ctx.font         = `bold 50px "Clarity City"`

            const text = `IMPRESS ME`
            ctx.fillText (text, cnv.width / 2, cnv.height / 2)

            requestAnimationFrame (drawFrame)
         }

         requestAnimationFrame (drawFrame)
      }

      document.fonts.ready.then (() => initAnimation ())
      
      // Cleanup
      return () => {
         globalThis.onresize = null
      }
   }, [])

   return (
      <div style={{ position: "relative", width: "100%", height: "100vh" }}>
         <canvas ref={ canvasRef }></canvas>
         <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 20 }}>
            <ThemeToggle />
         </div>
      </div>
   );
}