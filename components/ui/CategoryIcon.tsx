"use client";

import {
  Scissors,
  Heart,
  Star,
  Users,
  Building2,
  TrendingUp,
  Megaphone,
  Repeat2,
  Sparkles,
  UserPlus,
  Network,
  LucideProps,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Scissors,
  Heart,
  Star,
  Users,
  Building2,
  TrendingUp,
  Megaphone,
  Repeat2,
  Sparkles,
  UserPlus,
  Network,
};

interface CategoryIconProps extends LucideProps {
  icon: string;
}

export default function CategoryIcon({ icon, ...props }: CategoryIconProps) {
  const Icon = ICON_MAP[icon];
  if (!Icon) return null;
  return <Icon {...props} />;
}
