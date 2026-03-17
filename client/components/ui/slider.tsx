import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium">{label}</label>
          <span className="text-sm text-muted-foreground">{props.value}</span>
        </div>
      )}
      <input
        type="range"
        className={cn(
          "w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  )
)
Slider.displayName = "Slider"

export { Slider }

