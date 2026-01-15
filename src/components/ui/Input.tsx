"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "game";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full font-game transition-all duration-200",
          "focus:outline-none",
          {
            "bg-gradient-to-b from-[#2D2D2D] to-[#1B1B1B] border-4 border-[#373737] px-4 py-3 text-white text-center text-[1.4em]":
              variant === "default",
            "bg-gradient-to-b from-[#4A4A4A] to-[#2D2D2D] border-4 border-[#1B1B1B] px-4 py-3 text-white text-[1.25em]":
              variant === "game",
          },
          "focus:border-[var(--diamond)] focus:shadow-[0_0_15px_var(--diamond)]",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full font-game transition-all duration-200 min-h-[80px]",
          "bg-gradient-to-b from-[#4A4A4A] to-[#2D2D2D] border-4 border-[#1B1B1B] px-4 py-3 text-white text-[1.25em]",
          "focus:outline-none focus:border-[var(--diamond)] focus:shadow-[0_0_15px_var(--diamond)]",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Input, Textarea };
