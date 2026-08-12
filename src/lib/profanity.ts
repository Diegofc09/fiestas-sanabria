/**
 * Filtro de lenguaje ofensivo para comentarios.
 * Normaliza el texto (acentos, leet speak, repeticiones y separadores)
 * para detectar insultos aunque se escriban camuflados.
 */

/** Raíces de insultos y expresiones ofensivas (español y algunas en inglés). */
const BAD_WORDS = [
  "gilipoll",
  "gilipoya",
  "hijoputa",
  "hijodeputa",
  "hideputa",
  "putaz",
  "puta",
  "puto",
  "putilla",
  "zorra",
  "zorron",
  "cabron",
  "cabrona",
  "capullo",
  "pendejo",
  "mamon",
  "mamahuevo",
  "malparido",
  "maricon",
  "marica",
  "bollera",
  "travelo",
  "sudaca",
  "negrata",
  "moraco",
  "gitanaco",
  "subnormal",
  "retrasado",
  "mongolo",
  "mongolico",
  "imbecil",
  "idiota",
  "estupido",
  "tarado",
  "cretino",
  "memo",
  "besugo",
  "panoli",
  "mierda",
  "mierdoso",
  "cagada",
  "joder",
  "jodete",
  "jodido",
  "coño",
  "cono",
  "polla",
  "pollon",
  "pito",
  "chocho",
  "follar",
  "follon",
  "folla",
  "chupapoll",
  "chupamela",
  "pajero",
  "pajillero",
  "cornudo",
  "guarro",
  "guarra",
  "puerca",
  "asqueroso",
  "escoria",
  "basura humana",
  "muerete",
  "matate",
  "ojala te mueras",
  "fuck",
  "fck",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "whore",
  "nigger",
  "retard",
];

/** Permite palabras legítimas que contienen una raíz ofensiva. */
const ALLOWLIST = ["putxinel", "conocer", "conozco", "conocido", "conoce", "conocimiento", "cono de", "memoria", "memorable", "sudacapital"];

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  $: "s",
  "!": "i",
  "*": "",
  "+": "t",
};

/** Normaliza el texto para comparar: minúsculas, sin acentos, sin leet ni repeticiones. */
export function normalizeForFilter(text: string): string {
  let out = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  out = out.replace(/ñ/g, "n");
  out = out.replace(/[0-9@$!*+]/g, (ch) => LEET[ch] ?? ch);
  // Separadores usados para camuflar: p.u.t.a / p-u-t-a / p u t a
  out = out.replace(/[^a-z\s]/g, "");
  out = out.replace(/(.)\1{2,}/g, "$1$1");
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

/** Variante sin espacios, para detectar insultos partidos letra a letra. */
function collapsed(text: string): string {
  return normalizeForFilter(text).replace(/\s+/g, "");
}

/** Devuelve true si el texto contiene lenguaje ofensivo. */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const normalized = normalizeForFilter(text);
  const tight = collapsed(text);
  let allowed = normalized;
  let allowedTight = tight;
  for (const safe of ALLOWLIST) {
    const safeNorm = normalizeForFilter(safe);
    allowed = allowed.split(safeNorm).join(" ");
    allowedTight = allowedTight.split(safeNorm.replace(/\s+/g, "")).join("");
  }
  return BAD_WORDS.some((word) => {
    const needle = normalizeForFilter(word);
    if (!needle) return false;
    if (needle.includes(" ")) {
      return allowed.includes(needle) || allowedTight.includes(needle.replace(/\s+/g, ""));
    }
    return allowed.includes(needle) || allowedTight.includes(needle);
  });
}

export const PROFANITY_MESSAGE =
  "El comentario contiene lenguaje ofensivo. Reescríbelo con respeto para publicarlo.";
