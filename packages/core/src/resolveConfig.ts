import defu from 'defu'
import { pick } from 'lodash-es'
import type { ResolvedUserConfig, UnlighthouseTabs, UserConfig } from './types'
import { defaultConfig } from './constants'
import { normaliseHost } from './util'

/**
 * A provided configuration from the user may require runtime transformations to avoid breaking app functionality.
 *
 * Mostly normalisation of data and provided sane runtime defaults when configuration hasn't been fully provided, also
 * includes configuration alias helpers though such as `scanner.throttle`.
 *
 * @param userConfig
 */
export const resolveUserConfig: (userConfig: UserConfig) => ResolvedUserConfig = (userConfig) => {
  // apply default config
  const config = defu(userConfig, defaultConfig)

  // it's possible we don't know the host at runtime
  if (config.host) {
    // normalise host
    config.host = normaliseHost(config.host)
  }
  if (!config.lighthouseOptions)
    config.lighthouseOptions = {}
  // for local urls we disable throttling
  if (!config.host || config.host.includes('localhost') || !config.scanner?.throttle) {
    config.lighthouseOptions.throttlingMethod = 'provided'
    config.lighthouseOptions.throttling = {
      rttMs: 0,
      throughputKbps: 0,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0, // 0 means unset
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    }
  }
  if (!config.lighthouseOptions.onlyCategories)
    config.lighthouseOptions.onlyCategories = ['performance', 'accessibility', 'best-practices', 'seo']

  if (config.client?.columns) {
    // filter out any columns for categories we're not showing
    config.client.columns = pick(config.client.columns, ['overview', ...config.lighthouseOptions.onlyCategories as UnlighthouseTabs[]])
  }

  return config as ResolvedUserConfig
}
