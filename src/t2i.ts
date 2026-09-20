import type { JrysConfig } from './types.js'

/**
 * ArrayBuffer 转 Base64 字符串（分块处理，防止大文件爆调用栈）
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000 // 32KB
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
    binary += String.fromCharCode.apply(null, chunk as unknown as number[])
  }
  return btoa(binary)
}

/**
 * 调用 AstrBot T2I 服务将 HTML 渲染为 1080x1920 高清 JPEG 图片
 * @returns 图片 Base64 字符串
 */
export async function renderHtmlToImageBase64(
  html: string,
  config: JrysConfig,
): Promise<{ base64: string; byteSize: number }> {
  const baseUrl = (config.t2i_url || 'https://clown145-astrbot-t2i-service.hf.space').replace(/\/+$/, '')
  const endpoint = `${baseUrl}/text2img/generate`

  const timeoutMs = config.t2i_timeout || 25000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html,
        json: false,
        options: {
          type: 'jpeg',
          quality: 85,
          full_page: true,
          viewport: {
            width: 1080,
            height: 1920,
          },
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`T2I 服务响应错误 (HTTP ${response.status}): ${errorText.slice(0, 300)}`)
    }

    const buffer = await response.arrayBuffer()
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('T2I 服务返回了空数据')
    }

    const base64 = arrayBufferToBase64(buffer)
    return {
      base64,
      byteSize: buffer.byteLength,
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`T2I 渲染超时 (${timeoutMs}ms)，请检查 T2I 节点健康状态`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
