import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getJwCurrentArticleTitle } from '../parcer/jw'
import jwHomePage from '../mock/jw-home-page.html?raw'
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
      data: jwHomePage,
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
})
