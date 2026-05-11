import { describe, it, expect, vi } from 'vitest'
import { sanitizeUrl } from '../format'

describe('sanitizeUrl', () => {
  it('should allow valid http/https URLs', () => {
    expect(sanitizeUrl('https://example.com/image.png')).toBe('https://example.com/image.png')
    expect(sanitizeUrl('http://example.com/image.png')).toBe('http://example.com/image.png')
  })

  it('should allow relative paths', () => {
    expect(sanitizeUrl('/storage/v1/object/public/avatars/test.png')).toBe('/storage/v1/object/public/avatars/test.png')
  })

  it('should reject javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeUndefined()
    expect(sanitizeUrl('  javascript:alert(1)  ')).toBeUndefined()
  })

  it('should reject data: URLs (common XSS vector)', () => {
    expect(sanitizeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBeUndefined()
  })

  it('should return undefined for empty input', () => {
    expect(sanitizeUrl('')).toBeUndefined()
    expect(sanitizeUrl(null)).toBeUndefined()
    expect(sanitizeUrl(undefined)).toBeUndefined()
  })
})
