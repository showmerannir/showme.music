import * as cheerio from 'cheerio'

export interface ScrapedContact {
  emails: string[]
  phones: string[]
  contactPageUrl?: string
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const PHONE_REGEX =
  /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.\-]?)?\d{3}[\s.\-]?\d{4}(?:\s?(?:x|ext\.?)\s?\d{1,5})?/g

const BLOCKED_EMAIL_DOMAINS = ['example.com', 'sentry.io', 'domain.com', 'email.com']
const BLOCKED_EMAIL_PREFIXES = ['noreply', 'no-reply', 'donotreply', 'do-not-reply', 'bounce', 'mailer-daemon']

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}

function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase()
  const [prefix, domain] = lower.split('@')
  if (!prefix || !domain) return false

  if (BLOCKED_EMAIL_PREFIXES.some((blocked) => prefix.startsWith(blocked))) {
    return false
  }

  if (BLOCKED_EMAIL_DOMAINS.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`))) {
    return false
  }

  // Filter out common false positives (image/script filenames mistaken for emails)
  if (/\.(png|jpg|jpeg|gif|svg|webp|css|js|ts|tsx|jsx|woff|woff2|ttf)$/i.test(lower)) {
    return false
  }

  return true
}

function extractEmailsFromText(text: string): string[] {
  const matches = text.match(EMAIL_REGEX) ?? []
  return matches.filter(isValidEmail).map((e) => e.toLowerCase())
}

function extractPhonesFromText(text: string): string[] {
  const matches = text.match(PHONE_REGEX) ?? []
  return matches
    .map((p) => p.trim())
    .filter((p) => {
      // Must have at least 7 digits
      const digits = p.replace(/\D/g, '')
      return digits.length >= 7 && digits.length <= 15
    })
}

function dedup<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

async function fetchPage(url: string, timeoutMs = 10000): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ShowMeMusicBot/1.0; +https://showme.music)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    clearTimeout(timer)

    if (!response.ok) return null
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null
    }

    return await response.text()
  } catch {
    return null
  }
}

function parsePage(html: string): { emails: string[]; phones: string[] } {
  const $ = cheerio.load(html)

  const emails: string[] = []
  const phones: string[] = []

  // Extract from mailto: links
  $('a[href^="mailto:"]').each((_i, el) => {
    const href = $(el).attr('href') ?? ''
    const email = href.replace(/^mailto:/i, '').split('?')[0].trim()
    if (email && isValidEmail(email)) {
      emails.push(email.toLowerCase())
    }
  })

  // Extract from tel: links
  $('a[href^="tel:"]').each((_i, el) => {
    const href = $(el).attr('href') ?? ''
    const phone = href.replace(/^tel:/i, '').trim()
    if (phone) phones.push(phone)
  })

  // Extract emails from visible text content
  $('body').find('*').not('script, style, noscript').each((_i, el) => {
    const text = $(el).clone().children().remove().end().text()
    extractEmailsFromText(text).forEach((e) => emails.push(e))
    extractPhonesFromText(text).forEach((p) => phones.push(p))
  })

  // Also scan the full raw HTML for emails (catches obfuscated patterns)
  extractEmailsFromText(html).forEach((e) => emails.push(e))

  return {
    emails: dedup(emails).filter(isValidEmail),
    phones: dedup(phones),
  }
}

function resolveContactPageUrl(baseUrl: string, path: string): string {
  try {
    return new URL(path, baseUrl).toString()
  } catch {
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }
}

export async function scrapeContactInfo(websiteUrl: string): Promise<ScrapedContact> {
  if (!websiteUrl) {
    return { emails: [], phones: [] }
  }

  try {
    const baseUrl = normalizeUrl(websiteUrl)

    // Fetch the main page first
    const mainHtml = await fetchPage(baseUrl)
    let emails: string[] = []
    let phones: string[] = []
    let contactPageUrl: string | undefined

    if (mainHtml) {
      const mainResult = parsePage(mainHtml)
      emails = mainResult.emails
      phones = mainResult.phones

      // Look for contact/about page links in the HTML
      const $ = cheerio.load(mainHtml)
      const contactLinks: string[] = []

      $('a[href]').each((_i, el) => {
        const href = $(el).attr('href') ?? ''
        const text = $(el).text().toLowerCase().trim()
        const hrefLower = href.toLowerCase()

        if (
          hrefLower.includes('/contact') ||
          hrefLower.includes('/about') ||
          hrefLower.includes('/reach') ||
          hrefLower.includes('/get-in-touch') ||
          text.includes('contact') ||
          text.includes('about us') ||
          text.includes('reach us')
        ) {
          // Only relative or same-domain links
          if (href.startsWith('/') || href.startsWith(baseUrl) || (!href.startsWith('http'))) {
            const resolved = resolveContactPageUrl(baseUrl, href)
            if (!contactLinks.includes(resolved)) {
              contactLinks.push(resolved)
            }
          }
        }
      })

      if (contactLinks.length > 0) {
        contactPageUrl = contactLinks[0]
      }
    }

    // If we don't have emails yet, try /contact and /about pages
    const pagesToTry: string[] = []

    if (emails.length === 0) {
      if (contactPageUrl) {
        pagesToTry.push(contactPageUrl)
      }
      // Also try common paths directly
      pagesToTry.push(
        resolveContactPageUrl(baseUrl, '/contact'),
        resolveContactPageUrl(baseUrl, '/contact-us'),
        resolveContactPageUrl(baseUrl, '/about'),
      )
    }

    for (const pageUrl of pagesToTry) {
      if (emails.length > 0) break
      const html = await fetchPage(pageUrl)
      if (!html) continue

      const result = parsePage(html)
      if (result.emails.length > 0) {
        emails = dedup([...emails, ...result.emails])
        phones = dedup([...phones, ...result.phones])
        contactPageUrl = pageUrl
        break
      }
      phones = dedup([...phones, ...result.phones])
    }

    return {
      emails: dedup(emails).filter(isValidEmail),
      phones: dedup(phones),
      contactPageUrl,
    }
  } catch {
    return { emails: [], phones: [] }
  }
}
