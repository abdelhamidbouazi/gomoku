import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className="sr-only"
        ref={ref}
        {...props}
      />
      <div
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          props.checked ? "bg-primary" : "bg-muted",
          className
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            props.checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </div>
      {label && <span className="text-sm">{label}</span>}
    </label>
  )
)
Switch.displayName = "Switch"

export { Switch }

