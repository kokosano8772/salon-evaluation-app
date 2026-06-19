"use client";

import {
  Scissors,
  Heart,
  Star,
  Users,
  Building2,
  TrendingUp,
  LucideProps,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Scissors,
  Heart,
  Star,
  Users,
  Building2,
  TrendingUp,
};

interface CategoryIconProps extends LucideProps {
  icon: string;
}

export default function CategoryIcon({ icon, ...props }: CategoryIconProps) {
  const Icon = ICON_MAP[icon];
  if (!Icon) return null;
  return <Icon {...props} />;
}
