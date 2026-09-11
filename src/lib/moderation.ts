// src/lib/moderation.ts

// Lista ampliada de términos y expresiones no permitidas en la comunidad musical
const FORBIDDEN_WORDS = [
  // Citas / Contenido Explícito
  'sexo',
  'sexual',
  'citas',
  'hot',
  'desnudo',
  'desnuda',
  'onlyfans',
  'follar',
  'sex',
  'tinder',
  'porno',
  'erotico',
  'erotica',
  'desnudos',
  'pasion'
]

export interface ModerationResult {
  isSafe: boolean
  reason?: string
  blockedWord?: string
}

/**
 * Normaliza el texto quitando acentos y caracteres especiales para evitar
 * que se salten el filtro con variaciones como "sèxô" o "cítas".
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
}

export function checkContentSafety(text: string): ModerationResult {
  if (!text || text.trim() === '') {
    return { isSafe: true }
  }

  const cleanText = normalizeText(text)

  for (const word of FORBIDDEN_WORDS) {
    const cleanWord = normalizeText(word)
    
    // Comprobar coincidencia por palabra completa o sufijo/prefijo evidente
    if (cleanText.includes(cleanWord)) {
      return {
        isSafe: false,
        reason: `Contenido o intención inapropiada detectada. TocaConmigo es una plataforma exclusiva para colaboración musical.`,
        blockedWord: word
      }
    }
  }

  return { isSafe: true }
}