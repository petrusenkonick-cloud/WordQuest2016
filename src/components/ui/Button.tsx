"use client";

import { cn } from "@/lib/utils";
import { forwardRef, ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { useAudio } from "@/hooks/useAudio";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size" | "children"> {
  children?: ReactNode;
  variant?: "grass" | "stone" | "gold" | "diamond" | "emerald" | "redstone" | "obsidian" | "primary" | "secondary";
  size?: "sm" | "md" | "lg" | "xl";
  glow?: boolean;
  pixelBorder?: boolean;
  silent?: boolean; // Disable click sound
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "grass", size = "md", glow = false, pixelBorder = true, silent = false, children, disabled, onClick, ...props }, ref) => {
    const { playSound } = useAudio();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !silent) {
        playSound("click");
      }
      onClick?.(e);
    };

    const baseStyles = `
      relative font-pixel cursor-pointer select-none
      inline-flex items-center justify-center gap-2
      transition-all duration-75 ease-out
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    `;

    const variantStyles = {
      grass: `
        bg-gradient-to-b from-[#90D865] via-[#5D8C3E] to-[#3D6628]
        text-white
        shadow-[inset_3px_3px_0_rgba(255,255,255,0.35),inset_-3px_-3px_0_rgba(0,0,0,0.4),4px_4px_0_#2D4A1A,6px_6px_12px_rgba(0,0,0,0.4)]
        hover:shadow-[inset_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_0_rgba(0,0,0,0.35),4px_4px_0_#2D4A1A,6px_6px_16px_rgba(0,0,0,0.5)]
        active:shadow-[inset_3px_3px_0_rgba(0,0,0,0.3),inset_-2px_-2px_0_rgba(255,255,255,0.15),2px_2px_0_#2D4A1A]
        active:translate-x-[2px] active:translate-y-[2px]
        border-[#2D4A1A]
      `,
      stone: `
        bg-gradient-to-b from-[#A8A8A8] via-[#8A8A8A] to-[#5A5A5A]
        text-white
        shadow-[inset_3px_3px_0_rgba(255,255,255,0.3),inset_-3px_-3px_0_rgba(0,0,0,0.45),4px_4px_0_#3A3A3A,6px_6px_12px_rgba(0,0,0,0.4)]
        hover:shadow-[inset_3px_3px_0_rgba(255,255,255,0.4),inset_-3px_-3px_0_rgba(0,0,0,0.4),4px_4px_0_#3A3A3A,6px_6px_16px_rgba(0,0,0,0.5)]
        active:shadow-[inset_3px_3px_0_rgba(0,0,0,0.35),inset_-2px_-2px_0_rgba(255,255,255,0.1),2px_2px_0_#3A3A3A]
        active:translate-x-[2px] active:translate-y-[2px]
        border-[#3A3A3A]
      `,
      gold: `
        bg-gradient-to-b from-[#FFE866] via-[#FCDB05] to-[#C5A800]
        text-[#4A3800]
        shadow-[inset_3px_3px_0_rgba(255,255,255,0.5),inset_-3px_-3px_0_rgba(0,0,0,0.25),4px_4px_0_#8B7300,6px_6px_12px_rgba(0,0,0,0.4),0_0_20px_rgba(252,219,5,0.3)]
        hover:shadow-[inset_3px_3px_0_rgba(255,255,255,0.6),inset_-3px_-3px_0_rgba(0,0,0,0.2),4px_4px_0_#8B7300,6px_6px_16px_rgba(0,0,0,0.5),0_0_30px_rgba(252,219,5,0.5)]
        active:shadow-[inset_3px_3px_0_rgba(0,0,0,0.2),inset_-2px_-2px_0_rgba(255,255,255,0.3),2px_2px_0_#8B7300,0_0_15px_rgba(252,219,5,0.4)]
        active:translate-x-[2px] active:translate-y-[2px]
        border-[#8B7300]
      `,
      diamond: `
        bg-gradient-to-b from-[#7FFFD4] via-[#4AEDD9] to-[#2BA89D]
        text-[#004D40]
        shadow-[inset_3px_3px_0_rgba(255,255,255,0.5),inset_-3px_-3px_0_rgba(0,0,0,0.25),4px_4px_0_#1A6B60,6px_6px_12px_rgba(0,0,0,0.4),0_0_20px_rgba(74,237,217,0.4)]
        hover:shadow-[inset_3px_3px_0_rgba(255,255,255,0.6),inset_-3px_-3px_0_rgba(0,0,0,0.2),4px_4px_0_#1A6B60,6px_6px_16px_rgba(0,0,0,0.5),0_0_35px_rgba(74,237,217,0.6)]
        active:shadow-[inset_3px_3px_0_rgba(0,0,0,0.2),inset_-2px_-2px_0_rgba(255,255,255,0.3),2px_2px_0_#1A6B60,0_0_15px_rgba(74,237,217,0.5)]
        active:translate-x-[2px] active:translate-y-[2px]
        border-[#1A6B60]
      `,
      emerald: `
        bg-gradient-to-b from-[#50FF7F] via-[#17D049] to-[#0C9430]
        text-[#003D00]
        shadow-[inset_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_0_rgba(0,0,0,0.3),4px_4px_0_#085020,6px_6px_12px_rgba(0,0,0,0.4),0_0_20px_rgba(23,208,73,0.4)]
        hover:shadow-[inset_3px_3px_0_rgba(255,255,255,0.55),inset_-3px_-3px_0_rgba(0,0,0,0.25),4px_4px_0_#085020,6px_6px_16px_rgba(0,0,0,0.5),0_0_35px_rgba(23,208,73,0.6)]
        active:shadow-[inset_3px_3px_0_rgba(0,0,0,0.25),inset_-2px_-2px_0_rgba(255,255,255,0.2),2px_2px_0_#085020,0_0_15px_rgba(23,208,73,0.5)]
        active:translate-x-[2px] active:translate-y-[2px]
        border-[#085020]
      `,
      redstone: `
        bg-gradient-to-b from-[#FF6666] via-[#FF1A1A] to-[#AA0000]
        text-white
        shadow-[inset_3px_3px_0_rgba(255,255,255,0.3),inset_-3px_-3px_0_rgba(0,0,0,0.4),4px_4px_0_#550000,6px_6px_12px_rgba(0,0,0,0.4),0_0_15px_rgba(255,26,26,0.5)]
        hover:shadow-[inset_3px_3px_0_rgba(255,255,255,0.4),inset_-3px_-3px_0_rgba(0,0,0,0.35),4px_4px_0_#550000,6px_6px_16px_rgba(0,0,0,0.5),0_0_25px_rgba(255,26,26,0.7)]
        active:shadow-[inset_3px_3px_0_rgba(0,0,0,0.35),inset_-2px_-2px_0_rgba(255,255,255,0.15),2px_2px_0_#550000,0_0_10px_rgba(255,26,26,0.6)]
        active:translate-x-[2px] active:translate-y-[2px]
        border-[#550000]
      `,
      obsidian: `
        bg-gradient-to-b from-[#3D3D5C] via-[#1B1B2F] to-[#0D0D1A]
        text-[#9B5FC0]
        shadow-[inset_3px_3px_0_rgba(155,95,192,0.2),inset_-3px_-3px_0_rgba(0,0,0,0.5),4px_4px_0_#0A0A15,6px_6px_12px_rgba(0,0,0,0.5),0_0_15px_rgba(155,95,192,0.2)]
        hover:shadow-[inset_3px_3px_0_rgba(155,95,192,0.3),inset_-3px_-3px_0_rgba(0,0,0,0.45),4px_4px_0_#0A0A15,6px_6px_16px_rgba(0,0,0,0.6),0_0_25px_rgba(155,95,192,0.35)]
        active:shadow-[inset_3px_3px_0_rgba(0,0,0,0.4),inset_-2px_-2px_0_rgba(155,95,192,0.1),2px_2px_0_#0A0A15]
        active:translate-x-[2px] active:translate-y-[2px]
        border-[#0A0A15]
      `,
      // Backwards compatibility aliases
      primary: `
        bg-gradient-to-b from-[#90D865] via-[#5D8C3E] to-[#3D6628]
        text-white
        shadow-[inset_3px_3px_0_rgba(255,255,255,0.35),inset_-3px_-3px_0_rgba(0,0,0,0.4),4px_4px_0_#2D4A1A,6px_6px_12px_rgba(0,0,0,0.4)]
        hover:shadow-[inset_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_0_rgba(0,0,0,0.35),4px_4px_0_#2D4A1A,6px_6px_16px_rgba(0,0,0,0.5)]
        active:shadow-[inset_3px_3px_0_rgba(0,0,0,0.3),inset_-2px_-2px_0_rgba(255,255,255,0.15),2px_2px_0_#2D4A1A]
        active:translate-x-[2px] active:translate-y-[2px]
        border-[#2D4A1A]
      `,
      secondary: `
        bg-gradient-to-b from-[#A8A8A8] via-[#8A8A8A] to-[#5A5A5A]
        text-white
        shadow-[inset_3px_3px_0_rgba(255,255,255,0.3),inset_-3px_-3px_0_rgba(0,0,0,0.45),4px_4px_0_#3A3A3A,6px_6px_12px_rgba(0,0,0,0.4)]
        hover:shadow-[inset_3px_3px_0_rgba(255,255,255,0.4),inset_-3px_-3px_0_rgba(0,0,0,0.4),4px_4px_0_#3A3A3A,6px_6px_16px_rgba(0,0,0,0.5)]
        active:shadow-[inset_3px_3px_0_rgba(0,0,0,0.35),inset_-2px_-2px_0_rgba(255,255,255,0.1),2px_2px_0_#3A3A3A]
        active:translate-x-[2px] active:translate-y-[2px]
        border-[#3A3A3A]
      `,
    };

    const sizeStyles = {
      sm: "text-[12px] px-3 py-2 min-h-[36px] border-2",
      md: "text-[14px] px-5 py-3 min-h-[48px] border-3",
      lg: "text-[16px] px-7 py-4 min-h-[58px] border-4",
      xl: "text-[18px] px-10 py-5 min-h-[72px] border-4",
    };

    const glowStyles = glow ? `
      before:absolute before:inset-0 before:rounded-inherit
      before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
      before:translate-x-[-100%] hover:before:translate-x-[100%]
      before:transition-transform before:duration-700
      overflow-hidden
    ` : "";

    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? {} : { scale: 1.02 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          glowStyles,
          pixelBorder && "rounded-none",
          !pixelBorder && "rounded-lg",
          "text-shadow-dark",
          className
        )}
        disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        {/* Inner highlight line */}
        <span className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>

        {/* Bottom shadow line */}
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-black/20 to-transparent" />
      </motion.button>
    );
  }
);

Button.displayName = "Button";

// Icon button variant for compact actions
interface IconButtonProps extends Omit<ButtonProps, "size"> {
  size?: "sm" | "md" | "lg";
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeStyles = {
      sm: "w-8 h-8 text-sm",
      md: "w-10 h-10 text-base",
      lg: "w-12 h-12 text-lg",
    };

    return (
      <Button
        ref={ref}
        className={cn(sizeStyles[size], "p-0", className)}
        {...props}
      />
    );
  }
);

IconButton.displayName = "IconButton";

export { Button, IconButton };
