import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getJwCurrentArticleTitle } from '../parsers/jwParser'
import jwHomePage1 from '../mock/jw-home-page-1.html?raw'
import jwHomePage2 from '../mock/jw-home-page-2.html?raw'
import axios from 'axios'

vi.mock('axios')

describe('JW Parser Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should successfully parse article title', async () => {
    axios.get.mockResolvedValue({
      data: jwHomePage1,
    })

    const title = await getJwCurrentArticleTitle()
    expect(title).toBe('Статья 1')

    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(axios.get).toHaveBeenCalledWith('https://www.jw.org/ru/', {
      headers: {
        'User-Agent': expect.any(String),
      },
      timeout: 10000,
    })
  })

  it('should cache article and notify on change after cache expires', async () => {
    const notifyCallback = vi.fn()

    axios.get.mockResolvedValue({
      data: jwHomePage1,
    })
    const firstTitle = await getJwCurrentArticleTitle(notifyCallback)
    expect(firstTitle).toBe('Статья 1')
    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(notifyCallback).not.toHaveBeenCalled()

    const secondTitle = await getJwCurrentArticleTitle(notifyCallback)
    expect(secondTitle).toBe('Статья 1')
    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(notifyCallback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(60 * 60 * 1000)

    axios.get.mockResolvedValue({
      data: jwHomePage2,
    })

    const thirdTitle = await getJwCurrentArticleTitle(notifyCallback)
    expect(thirdTitle).toBe('Статья 2')
    expect(axios.get).toHaveBeenCalledTimes(2)
    expect(notifyCallback).toHaveBeenCalledTimes(1)
    expect(notifyCallback).toHaveBeenCalledWith('Статья 2')
  })
})
