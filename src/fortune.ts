import { BACKGROUND_CATEGORIES } from './data/backgrounds.js'
import jrysDataRaw from './data/jrys.json' with { type: 'json' }
import { createRng, randomChoice, weightedChoice } from './prng.js'
import type { FortuneData, FortuneItem, FortuneResult, JrysConfig } from './types.js'

const fortuneData = jrysDataRaw as unknown as FortuneData

/**
 * 获取北京时间 (UTC+8) 的年月日信息
 */
export function getBeijingDate(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const year = parts.find((p) => p.type === 'year')?.value ?? '2026'
  const month = parts.find((p) => p.type === 'month')?.value ?? '01'
  const day = parts.find((p) => p.type === 'day')?.value ?? '01'

  return {
    year,
    month,
    day,
    dateStr: `${year}-${month}-${day}`, // e.g. 2026-09-20
    displayDate: `${year}/${month}/${day}`, // e.g. 2026/09/20
    monthDay: `${month}-${day}`, // e.g. 09-20
  }
}

/**
 * 核心运势计算函数
 */
export function calculateFortune(
  userId: string,
  userName: string,
  userAvatarUrl: string,
  config: JrysConfig,
  customDate?: Date,
): FortuneResult {
  const date = getBeijingDate(customDate)

  // 1. 初始化运势随机数发生器（根据 fixed_daily_fortune 确定是否锁定本日签文）
  const fortuneSeed = config.fixed_daily_fortune ? `${userId}-${date.dateStr}` : undefined
  const fortuneRng = createRng(fortuneSeed)

  // 2. 判定节假日与爆率
  const isHoliday = config.holiday_rates_enabled && config.holidays.includes(date.monthDay)
  const currentRates = isHoliday ? config.holiday_rates : config.normal_rates

  // 3. 筛选有效运势区间键名
  const validKeys = Object.keys(fortuneData).filter((k) => !k.startsWith('_'))
  const goodKeys = validKeys.filter((k) => Number.parseInt(k, 10) > 70)
  const normalKeys = validKeys.filter((k) => {
    const val = Number.parseInt(k, 10)
    return val >= 56 && val <= 70
  })
  const badKeys = validKeys.filter((k) => Number.parseInt(k, 10) < 56)

  // 4. 计算每个分段的权重
  const weights: number[] = []
  for (const k of validKeys) {
    const val = Number.parseInt(k, 10)
    if (val > 70) {
      weights.push(currentRates.good / Math.max(goodKeys.length, 1))
    } else if (val >= 56) {
      weights.push(currentRates.normal / Math.max(normalKeys.length, 1))
    } else {
      weights.push(currentRates.bad / Math.max(badKeys.length, 1))
    }
  }

  // 5. 加权抽取运势分类，再从中随机挑选一条签文
  const categoryKey = weightedChoice(validKeys, weights, fortuneRng)
  const categoryFortunes = fortuneData[categoryKey] ?? []
  if (categoryFortunes.length === 0) {
    throw new Error(`No fortune items found for key: ${categoryKey}`)
  }
  const item: FortuneItem = randomChoice(categoryFortunes, fortuneRng)

  // 6. 背景图抽取：
  // 遵循原版 astrbot_plugin_jrys 行为：即使每日签文固定，每次指令也重新随机抽取一张壁纸
  // 若用户开启 fixed_daily_background，则随签文一同固定
  const bgRng = config.fixed_daily_background ? fortuneRng : createRng()
  const categories = Object.keys(BACKGROUND_CATEGORIES)
  const chosenCategory = randomChoice(categories, bgRng)
  const categoryUrls = BACKGROUND_CATEGORIES[chosenCategory] ?? []
  const backgroundUrl = categoryUrls.length > 0 ? randomChoice(categoryUrls, bgRng) : ''

  return {
    item,
    categoryKey,
    backgroundUrl,
    backgroundCategory: chosenCategory,
    date,
    userId,
    userName,
    userAvatarUrl,
    isHoliday,
  }
}
