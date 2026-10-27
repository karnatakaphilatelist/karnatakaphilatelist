/** Short postal terms that are always written in capitals, e.g. "Mysuru HO". */
const ACRONYMS = new Set(["so", "bo", "ho", "gpo", "hpo", "mdg", "pb", "po", "nal", "sgs"]);
/** Small words that stay lower case unless they start the name. */
const SMALL_WORDS = new Set(["of", "the", "and", "at", "in", "on", "for"]);

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

/**
 * Tidies a place name for display: consistent capitals, "h o" written as "HO",
 * and postal terms such as SO / BO / HO in capitals. The stored data is never
 * changed, and spelling is left alone, so "shivmogga" becomes "Shivmogga".
 */
export function formatPlaceName(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/\s+/g, " ")
    // "karkala h o" -> "karkala ho", "kaup s o" -> "kaup so"
    .replace(/\b([hsb]) o\b/gi, "$1o");

  let isFirstWord = true;
  return cleaned
    .split(/(\s+|-)/)
    .map((token) => {
      if (token === "" || /^(\s+|-)$/.test(token)) return token;
      const lower = token.toLowerCase();
      const wasFirst = isFirstWord;
      isFirstWord = false;
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      if (!wasFirst && SMALL_WORDS.has(lower)) return lower;
      return capitalise(token);
    })
    .join("");
}
