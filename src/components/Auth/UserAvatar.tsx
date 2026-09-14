"use client";
import NiceAvatar, { genConfig } from "react-nice-avatar";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  /** Stable seed (user id) — same account always gets the same generated avatar. */
  seed: string;
  /** Google/other provider photo. When present, it wins over the generated one. */
  avatarUrl?: string | null;
  /** Pixel size (square). */
  size?: number;
  className?: string;
};

/**
 * Google login → shows the Google profile photo.
 * Email login → generates a fun illustrated avatar from the user id
 * ("surprise me" — deterministic, so it never changes between reloads).
 */
const UserAvatar = ({ seed, avatarUrl, size = 32, className }: UserAvatarProps) => {
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

  const config = genConfig(seed || "astrolens");
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