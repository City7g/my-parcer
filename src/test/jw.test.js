import { describe, it, expect } from 'vitest'
import { getJwCurrentArticleTitle } from '../parsers/jwParser'

describe('JW Parser Tests', () => {
  it('should parse article title from local HTML file', async () => {
    const title = await getJwCurrentArticleTitle()
    expect(title).toBe('Тревожность у мужчин')
  })
})
