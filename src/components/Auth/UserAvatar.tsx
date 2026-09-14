"use client";
import NiceAvatar, { genConfig } from "react-nice-avatar";
import { cn } from "@/lib/utils";

export type AvatarConfig = ReturnType<typeof genConfig>;

type UserAvatarProps = {
  /** Stable seed (user id) — same account always gets the same generated avatar. */
  seed: string;
  /** Google/other provider photo. When present, it wins over the generated one. */
  avatarUrl?: string | null;
  /** Exact avatar chosen at signup (saved in user metadata). Wins over seed. */
  avatarConfig?: AvatarConfig | null;
  /** Pixel size (square). */
  size?: number;
  className?: string;
};

/**
 * Google login → shows the Google profile photo.
 * Email login → shows the avatar picked at signup (saved config), falling
 * back to a deterministic "surprise me" avatar generated from the user id.
 */
const UserAvatar = ({ seed, avatarUrl, avatarConfig, size = 32, className }: UserAvatarProps) => {
  if (avatarUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element -- remote provider avatar */
      <img
        src={avatarUrl}
        alt="Profile avatar"
        referrerPolicy="no-referrer"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  const config = avatarConfig ?? genConfig(seed || "astrolens");
  return (
    <NiceAvatar
      style={{ width: size, height: size }}
      shape="circle"
      {...config}
      className={cn("shrink-0", className)}
    />
  );
};

export default UserAvatar;