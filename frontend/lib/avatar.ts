// Gera iniciais e uma cor estável a partir de um nome.

// Tons de preto fosco premium — variam levemente para distinguir avatars
// sem fugir da paleta monocromática.
const PALETTE = [
  { bg: "#1A1A1A", fg: "#FFFFFF" },
  { bg: "#121212", fg: "#FFFFFF" },
  { bg: "#222222", fg: "#FFFFFF" },
  { bg: "#1E1E1E", fg: "#FFFFFF" },
  { bg: "#161616", fg: "#FFFFFF" },
  { bg: "#262626", fg: "#FFFFFF" },
];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(name: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}
