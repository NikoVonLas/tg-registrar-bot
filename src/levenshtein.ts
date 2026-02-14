// Levenshtein distance algorithm for typo detection
export function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const len1 = s1.length;
  const len2 = s2.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

export function findClosestCity(input: string, cities: string[]): { city: string; distance: number } | null {
  const inputLower = input.toLowerCase();
  let closest: { city: string; distance: number } | null = null;

  for (const city of cities) {
    const distance = levenshteinDistance(inputLower, city);

    // Only consider if distance is <= 3 (max 3 typos)
    if (distance <= 3 && (!closest || distance < closest.distance)) {
      closest = { city, distance };
    }
  }

  // If exact match or very close match, return it
  // Otherwise, only suggest if distance is 1-3 (definitely a typo)
  if (closest && closest.distance > 0 && closest.distance <= 3) {
    return closest;
  }

  return null;
}
