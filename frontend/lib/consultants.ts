"use client";

export type Consultant = {
  name: string;
  phone: string;
};

export const consultants: Consultant[] = [
  { name: "ROGÉRIO", phone: "554391123383" },
  { name: "EMILY", phone: "554391123382" },
  { name: "HAROLDO", phone: "558199229266" },
  { name: "MARCO AURÉLIO", phone: "553499043897" },
  { name: "SANDRA", phone: "553591366601" },
  { name: "SILENE", phone: "554199151502" },
  { name: "NILTON", phone: "554399540100" },
];

const assignedKey = "alpha_consultant_assigned";
const lastIndexKey = "alpha_last_consultant_index";

function canUseStorage() {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

export function findConsultantByPhone(phone?: string | null) {
  if (!phone) return undefined;
  const digits = onlyDigits(phone);
  return consultants.find((consultant) => consultant.phone === digits);
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatConsultantPhone(phone: string) {
  const digits = onlyDigits(phone);

  if (digits.length === 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(
      4,
      8,
    )}-${digits.slice(8)}`;
  }

  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(
      4,
      9,
    )}-${digits.slice(9)}`;
  }

  return `+${digits}`;
}

export function getStoredConsultant() {
  if (!canUseStorage()) return undefined;

  try {
    const raw = window.localStorage.getItem(assignedKey);
    if (!raw) return undefined;

    const parsed = JSON.parse(raw) as Partial<Consultant>;
    const consultant = findConsultantByPhone(parsed.phone);

    return consultant;
  } catch {
    window.localStorage.removeItem(assignedKey);
    return undefined;
  }
}

export function storeConsultant(consultant: Consultant) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(assignedKey, JSON.stringify(consultant));
  window.localStorage.setItem(
    lastIndexKey,
    String(consultants.findIndex((item) => item.phone === consultant.phone)),
  );
}

export function assignNextConsultant() {
  const stored = getStoredConsultant();
  if (stored) return stored;

  let nextIndex = Math.floor(Math.random() * consultants.length);

  if (canUseStorage()) {
    const lastIndex = Number(window.localStorage.getItem(lastIndexKey));
    nextIndex = Number.isInteger(lastIndex)
      ? (lastIndex + 1) % consultants.length
      : nextIndex;
  }

  const consultant = consultants[nextIndex] || consultants[0];
  storeConsultant(consultant);

  return consultant;
}

export function buildConsultantWhatsAppUrl(consultant: Consultant) {
  const message =
    "Olá, vim pelo site da Alpha Convites e gostaria de falar com um consultor.";

  return `https://wa.me/${onlyDigits(consultant.phone)}?text=${encodeURIComponent(
    message,
  )}`;
}
