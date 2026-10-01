import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans text-xs tracking-wide transition-[color,background-color,border-color,transform,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-fg text-bg hover:bg-hot hover:text-hot-fg",
        ghost: "bg-transparent text-fg shadow-[0_0_0_1px_rgba(243,243,240,0.22)] hover:shadow-[0_0_0_1px_rgba(212,91,182,0.9)] hover:text-hot",
        hot: "bg-hot text-hot-fg hover:opacity-90",
        link: "bg-transparent text-fg hover:text-hot px-0",
      },
      size: {
        sm: "h-9 px-3.5",
        md: "h-10 px-4",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
