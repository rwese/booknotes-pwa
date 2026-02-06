#!/usr/bin/env node
/**
 * Version Management Script
 *
 * Updates package.json version AND CACHE_BUST_VERSION in vite.config.ts
 * to ensure proper cache invalidation on releases.
 *
 * Usage:
 *   node scripts/version.js --patch    # Patch bump (1.0.0 -> 1.0.1)
 *   node scripts/version.js --minor    # Minor bump (1.0.0 -> 1.1.0)
 *   node scripts/version.js --major    # Major bump (1.0.0 -> 2.0.0)
 *   node scripts/version.js --dry-run   # Show what would change
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')

// Parse arguments
const args = process.argv.slice(2)
const isPatch = args.includes('--patch')
const isMinor = args.includes('--minor')
const isMajor = args.includes('--major')
const isDryRun = args.includes('--dry-run')

const bumpType = isMajor ? 'major' : isMinor ? 'minor' : isPatch ? 'patch' : null

if (!bumpType) {
  console.error('Usage: node scripts/version.js [--patch|--minor|--major] [--dry-run]')
  console.error('  --patch   : Patch version bump (1.0.0 -> 1.0.1)')
  console.error('  --minor   : Minor version bump (1.0.0 -> 1.1.0)')
  console.error('  --major   : Major version bump (1.0.0 -> 2.0.0)')
  console.error('  --dry-run : Show what would change without modifying files')
  process.exit(1)
}

/**
 * SemVer bump function
 */
function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      return version
  }
}

/**
 * Read and parse package.json
 */
function readPackageJson() {
  const path = join(ROOT_DIR, 'package.json')
  const content = readFileSync(path, 'utf-8')
  return { path, content: JSON.parse(content) }
}

/**
 * Update vite.config.ts CACHE_BUST_VERSION
 */
function updateViteConfig(newVersion, packageVersion) {
  const path = join(ROOT_DIR, 'vite.config.ts')
  const content = readFileSync(path, 'utf-8')

  const newContent = content.replace(
    /const CACHE_BUST_VERSION = '[\d.]+'/,
    `const CACHE_BUST_VERSION = '${packageVersion}'`
  )

  if (isDryRun) {
    console.log(`  [DRY RUN] Would update vite.config.ts: CACHE_BUST_VERSION -> '${packageVersion}'`)
  } else {
    writeFileSync(path, newContent)
    console.log(`  Updated vite.config.ts: CACHE_BUST_VERSION = '${packageVersion}'`)
  }
}

/**
 * Main execution
 */
function main() {
  console.log(`\n🚀 Version Bump (${bumpType})\n`)

  const { path: pkgPath, content: pkg } = readPackageJson()
  const currentVersion = pkg.version
  const newVersion = bumpVersion(currentVersion, bumpType)

  console.log(`  Current package version: ${currentVersion}`)
  console.log(`  New package version:    ${newVersion}`)
  console.log('')

  if (isDryRun) {
    console.log('  [DRY RUN] Would make the following changes:')
  } else {
    console.log('  Making the following changes:')
  }

  // Update package.json version
  if (isDryRun) {
    console.log(`  [DRY RUN] Would update package.json: version -> '${newVersion}'`)
  } else {
    pkg.version = newVersion
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    console.log(`  ✓ Updated package.json: version = '${newVersion}'`)
  }

  // Update vite.config.ts CACHE_BUST_VERSION
  updateViteConfig(newVersion, newVersion)

  console.log('')

  if (isDryRun) {
    console.log('  [DRY RUN] No files were modified.')
  } else {
    console.log('  ✓ Version bump complete!')
    console.log('')
    console.log('  Next steps:')
    console.log('    1. Review the changes: git diff')
    console.log('    2. Commit: git add -A && git commit -m "Release v' + newVersion + '"')
    console.log('    3. Tag: git tag v' + newVersion)
    console.log('    4. Push: git push && git push --tags')
    console.log('')
  }
}

main()
