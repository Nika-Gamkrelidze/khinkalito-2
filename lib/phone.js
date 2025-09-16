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

// Progressive formatter for input as the user types
export function formatGeorgianMobileInput(value) {
  const digitsOnly = value.replace(/\D/g, "");
  // Ensure prefix 995
  let digits = digitsOnly.startsWith("995") ? digitsOnly : (digitsOnly ? "995" + digitsOnly : "995");
  // Cap at 13 digits total (+995 XXX XX XX XX => 995 + 9 digits)
  digits = digits.slice(0, 12);
  const country = "+995";
  // After country code, we expect: XXX XX XX XX
  const rest = digits.slice(3);
  let out = country;
  if (rest.length === 0) return out + " ";
  if (rest.length <= 3) return `${out} ${rest}`; // XXX
  if (rest.length <= 5) return `${out} ${rest.slice(0,3)} ${rest.slice(3,5)}`; // XXX XX
  if (rest.length <= 7) return `${out} ${rest.slice(0,3)} ${rest.slice(3,5)} ${rest.slice(5,7)}`; // XXX XX XX
  return `${out} ${rest.slice(0,3)} ${rest.slice(3,5)} ${rest.slice(5,7)} ${rest.slice(7,9)}`; // XXX XX XX XX
}


