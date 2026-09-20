import { createMockContext, createMockSession, runCommand } from '@qqbot/sdk/testing'
import { describe, expect, it, vi } from 'vitest'
import { calculateFortune, getBeijingDate } from './fortune.js'
import plugin from './index.js'
import { hashString, mulberry32, weightedChoice } from './prng.js'
import { renderFortunePosterHtml } from './template.js'

describe('PRNG & Deterministic Seeding', () => {
  it('hashString 计算字符串散列值', () => {
    const h1 = hashString('user123-2026-09-20')
    const h2 = hashString('user123-2026-09-20')
    const h3 = hashString('user456-2026-09-20')
    expect(h1).toBe(h2)
    expect(h1).not.toBe(h3)
  })

  it('mulberry32 在同一种子下产生确定性随机序列', () => {
    const rng1 = mulberry32(123456)
    const rng2 = mulberry32(123456)
    const seq1 = [rng1(), rng1(), rng1()]
    const seq2 = [rng2(), rng2(), rng2()]
    expect(seq1).toEqual(seq2)
    for (const v of seq1) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('weightedChoice 按权重抽取', () => {
    const items = ['A', 'B']
    const weights = [0, 100]
    const chosen = weightedChoice(items, weights, () => 0.5)
    expect(chosen).toBe('B')
  })
})

describe('Fortune Calculation', () => {
  const config = plugin.defaultConfig!

  it('同一用户在同一天多次抽取签文结果固定', () => {
    const res1 = calculateFortune('user_abc', '测试用户', 'https://avatar.test/1', config, new Date('2026-09-20T10:00:00Z'))
    const res2 = calculateFortune('user_abc', '测试用户', 'https://avatar.test/1', config, new Date('2026-09-20T11:00:00Z'))

    expect(res1.item.fortuneSummary).toBe(res2.item.fortuneSummary)
    expect(res1.item.luckyStar).toBe(res2.item.luckyStar)
    expect(res1.item.signText).toBe(res2.item.signText)
  })

  it('fixed_daily_background=true 时背景图随签文一同固定', () => {
    const customConfig = { ...config, fixed_daily_background: true }
    const res1 = calculateFortune('user_abc', '测试用户', 'https://avatar.test/1', customConfig, new Date('2026-09-20T10:00:00Z'))
    const res2 = calculateFortune('user_abc', '测试用户', 'https://avatar.test/1', customConfig, new Date('2026-09-20T11:00:00Z'))

    expect(res1.backgroundUrl).toBe(res2.backgroundUrl)
  })

  it('节假日自动激活高爆率', () => {
    const newYearDate = new Date('2026-01-01T12:00:00+08:00')
    const res = calculateFortune('user_xyz', '用户', '', config, newYearDate)
    expect(res.isHoliday).toBe(true)
  })
})

describe('HTML Poster Template', () => {
  it('生成 1:1 还原原版 painter.py 的 HTML', () => {
    const fortune = calculateFortune('user_1', '张三', 'https://avatar.test/a.jpg', plugin.defaultConfig!)
    const html = renderFortunePosterHtml(fortune)

    expect(html).toContain('1080')
    expect(html).toContain('1920')
    expect(html).toContain(fortune.item.fortuneSummary)
    expect(html).toContain(fortune.item.luckyStar)
    expect(html).toContain('translucent-layer')
    expect(html).toContain('avatar-img')
    expect(html).toContain('仅供娱乐 | 相信科学 | 请勿迷信')
  })
})

describe('Commands', () => {
  it('/jrys_last 在无记录时提示先抽取', async () => {
    const session = await runCommand(plugin, 'jrys_last')
    expect(session.replies[0]).toContain('你还没有生成过今日运势哦')
  })

  it('/jrys_last 成功读取历史记录', async () => {
    const ctx = createMockContext(plugin)
    await ctx.kv.put(
      'last:u123',
      JSON.stringify({
        userId: 'u123',
        userName: '小明',
        fortuneSummary: '大吉',
        luckyStar: '★★★★★★☆',
        signText: '草木逢春',
        unsignText: '好运连连',
        backgroundUrl: 'https://example.com/bg.jpg',
        backgroundCategory: 'miku',
        displayDate: '2026/09/20',
        timestamp: Date.now(),
      }),
    )

    const session = createMockSession({ userId: 'u123', content: '/jrys_last' })
    const reply = await plugin.commands!.jrys_last!.handler({
      session,
      ctx,
      command: 'jrys_last',
      args: [],
      argText: '',
    })

    expect(reply).toMatchObject({
      text: expect.stringContaining('【上次运势回顾】'),
      image: { url: 'https://example.com/bg.jpg' },
    })
  })

  it('/jrys 调用 T2I 成功并返回图片 Base64', async () => {
    const mockImageBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]) // JPEG 标头
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        arrayBuffer: async () => mockImageBytes.buffer,
      }),
    )

    const session = await runCommand(plugin, 'jrys')
    expect(session.replies[0]).toMatchObject({
      image: {
        base64: expect.any(String),
      },
    })
    vi.unstubAllGlobals()
  })

  it('/jrys 当 T2I 渲染超时时自动降级发送图文卡片', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Connect timeout')),
    )

    const session = await runCommand(plugin, 'jrys')
    expect(session.replies[0]).toMatchObject({
      text: expect.stringContaining('【今日运势 · '),
    })
    vi.unstubAllGlobals()
  })
})
