export function isValidGeorgianMobile(phone) {
  if (typeof phone !== "string") return false;
  const normalized = phone.replace(/\s+/g, "");
  // Accept formats like +9955XXXXXXXX or +995 5XX XX XX XX with spaces
  const regex = /^\+9955\d{8}$/;
  return regex.test(normalized);
}

export function formatGeorgianMobile(phone) {
  const digits = phone.replace(/\D/g, "");
  if (!digits.startsWith("9955") || digits.length !== 12) return phone;
  const parts = [
    "+995",
    digits.slice(3, 4) + digits.slice(4, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
    digits.slice(10, 12)
  ];
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]} ${parts[4]}`;
}


