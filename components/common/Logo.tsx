interface LogoProps {
  // dark = 元の黒ロゴ（明るい背景用）。light = 白反転（黒・濃色背景用、単色ロゴ
  // なのでCSSフィルターで反転するだけで綺麗に白化できる。別データは用意しない）。
  variant?: "dark" | "light";
  className?: string;
}

export default function Logo({ variant = "dark", className = "" }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/koko-design-logo.svg"
      alt="KOKO DESIGN"
      className={className}
      style={variant === "light" ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
}
