/**
 * 确定性伪随机数生成器（PRNG）与抽样工具
 */

/**
 * 32位 FNV-1a 字符串散列函数
 */
export function hashString(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * Mulberry32 伪随机数发生器
 * 输入任意 32 位无符号整数种子，输出 [0, 1) 的确定性浮点序列
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next(): number {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 创建随机数发生器
 * 若未传 seed，回退到 Math.random
 */
export function createRng(seed?: string | number): () => number {
  if (seed === undefined) {
    return Math.random
  }
  const numericSeed = typeof seed === 'number' ? seed : hashString(seed)
  return mulberry32(numericSeed)
}

/**
 * 从列表中随机挑选一项
 */
export function randomChoice<T>(items: readonly T[] | T[], rng: () => number = Math.random): T {
  if (items.length === 0) {
    throw new Error('Cannot choose from empty array')
  }
  const index = Math.floor(rng() * items.length)
  return items[index]!
}

/**
 * 加权随机抽取
 */
export function weightedChoice<T>(items: readonly T[] | T[], weights: number[], rng: () => number = Math.random): T {
  if (items.length === 0 || items.length !== weights.length) {
    throw new Error('Invalid items or weights length')
  }
  const totalWeight = weights.reduce((acc, w) => acc + (w > 0 ? w : 0), 0)
  if (totalWeight <= 0) {
    return randomChoice(items, rng)
  }

  let threshold = rng() * totalWeight
  for (let i = 0; i < items.length; i++) {
    const w = weights[i]! > 0 ? weights[i]! : 0
    threshold -= w
    if (threshold <= 0) {
      return items[i]!
    }
  }
  return items[items.length - 1]!
}
