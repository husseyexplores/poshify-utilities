import { extname } from 'path'
import { writeFileSync } from 'fs'
import { execSync, exec } from 'child_process'
import glob from 'glob'
import packageJson from './package.json'

const capitalizeWord = (word: string) => word[0].toUpperCase() + word.slice(1)
const capitalize = (str: string) =>
  str.split(' ').filter(Boolean).map(capitalizeWord).join(' ')

const relativePath = (path: string) => {
  return path.replace('/public/', '')
}
const extInfo = {
  name: 'Poshify Utilities',
  description: packageJson.description,
}

const nameInPkgJson = capitalize(packageJson.name.replace(/[-_]/g, ' '))
if (nameInPkgJson !== extInfo.name) {
  console.error({ expected: extInfo.name, found: nameInPkgJson })
  throw new Error('Extension name in `package.json` is not correct.')
}

// vaildate description
if (!extInfo.description || extInfo.description.length > 132) {
  console.log({ expected: `132 max.`, found: `${extInfo.description.length}` })
  throw new Error(`Description too big. Chrome only supports 132 characters.`)
}

type AssetsByExtionsion = {
  css: string[]
  js: string[]
  resources: string[]
}

const builtAssets = glob.sync('dist/**', {
  nodir: true,
  absolute: true,
  ignore: ['dist/popup/**', 'dist/*'],
})

const assetsByExt = builtAssets.reduce<AssetsByExtionsion>(
  (acc, absolutePath) => {
    // Relative path from dist
    const relativePath = absolutePath.split('/dist/').at(-1)
    if (!relativePath)
      throw new Error(
        `Error while getting relative path from absolute path from "dist"`
      )

    let ext = extname(relativePath)
    if (ext.startsWith('.')) ext = ext.slice(1)

    // if (!acc[ext]) acc[ext] = []
    if (ext === 'js' || ext === 'css') {
      acc[ext].push(relativePath)
    } else {
      acc['resources'].push(relativePath)
    }

    return acc
  },
  {
    css: [],
    js: [], //,[relativePath('/public/webcomponents-bundle.js')],
    resources: [],
  }
)

const MATCHES = {
  match: [
    'https://*.myshopify.com/admin*',
    'https://admin.shopify.com/store/*',
  ],
  exclude: [
    // 'https://*.myshopify.com/admin/themes/*',
    'https://*.myshopify.com/admin/*.xml*',
    'https://*.myshopify.com/admin/*.json',
    // 'https://admin.shopify.com/store/*/themes/*',
    'https://admin.shopify.com/store/*/*.xml*',
    'https://admin.shopify.com/store/*/*.json',
  ],
  resource_match: ['https://*.myshopify.com/*', 'https://admin.shopify.com/*'],
}

const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: extInfo.name,
  short_name: extInfo.name,
  version: packageJson.version,
  description: extInfo.description,
  icons: {
    '16': relativePath('/public/icons/icon16.png'),
    '48': relativePath('/public/icons/icon48.png'),
    '128': relativePath('/public/icons/icon128.png'),
  },
  action: {
    default_title: extInfo.name,
    default_popup: relativePath('/public/popup/popup.html'),
    default_icon: {
      '16': relativePath('/public/icons/icon16.png'),
      '48': relativePath('/public/icons/icon48.png'),
      '128': relativePath('/public/icons/icon128.png'),
    },
  },
  background: {
    service_worker: relativePath('/public/background.js'),
  },
  content_scripts: [
    {
      matches: MATCHES.match,
      exclude_matches: MATCHES.exclude,
      js: assetsByExt.js,
      css: assetsByExt.css,
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources:
    assetsByExt.resources.length > 0
      ? [
          {
            resources: assetsByExt.resources,
            matches: MATCHES.resource_match,
          },
        ]
      : undefined,
  host_permissions: MATCHES.match,
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAg/JoMhE6KbssQWHiALiB9pocK5OLz1FhCw8fgUBKXwtKcAa8WBFRZbKQD9DrC+1LXLUrEvbb2vTHl+h/yX9sksB3648NMwPv+XbAcaXa19fxbOQCQcYZ8p2mlENvhY7i9mCTTq0/Xk4pT6H8bif4JUVJ1osBxZf6imhdHA7ZTprKUTpIBRYGdOqPnQOOXs0jcFGQRPA8AfusBjDRvRuzc1qbn9tYWs8xg6vDSeySL+/g9H5YVZoAsIrUi7/BqWblYzeCdsf/zCbv3NJ410itnyG+VpjEE3pI8kyqf4u9gKeF/JqIjr3Fzl3RZcAQEo2xDhFsASG+qJU/3cdd1MlgZQIDAQAB',
}

// Build for Chrome and firefox

// name/path must not end with `/`
const EXT = {
  CHR: {
    name: '_chrome_',
    get path() {
      return `./dist/${this.name}`
    },
  },
  FIR: {
    name: '_firefox_',
    get path() {
      return `./dist/${this.name}`
    },
  },
} as const

execSync(`mkdir ${EXT.CHR.path}`)

// Move all content into `_chrome_` dir
execSync(
  `cd dist && ls | grep -v ${EXT.CHR.name} | xargs mv -t ${EXT.CHR.name} && cd ..`
)

// Create `_firefox_` dir
execSync(`mkdir ${EXT.FIR.path}`)

// Move all `_chrome_` content into `_firefox_` content
execSync(`cp -r ${EXT.CHR.path}/* ${EXT.FIR.path}`)

/*
Now we have:
 - /dist/_chrome_/<all built files>
 - /dist/_firefox_/<all built files>

 Copy manifest into each directory
*/

const manifestString = JSON.stringify(manifest, null, 2)
writeFileSync(`${EXT.CHR.path}/manifest.json`, manifestString)

// Firefox manifest
const firefoxManifest: typeof manifest = JSON.parse(manifestString)

// Remove the key
delete firefoxManifest.key

// Update the `background` to use `scripts` instead of service_worker
if (firefoxManifest.background?.service_worker) {
  const bg = firefoxManifest.background as any
  bg.scripts = [bg.service_worker]
  delete bg.service_worker
}

// Add firefox extension id
firefoxManifest.browser_specific_settings =
  firefoxManifest.browser_specific_settings || {}
firefoxManifest.browser_specific_settings.gecko = {
  id: '{59b3965d-c6da-4d82-a587-1239584e1ee2}',
}

// Write firefox manifest
writeFileSync(
  `${EXT.FIR.path}/manifest.json`,
  JSON.stringify(firefoxManifest, null, 2)
)

// Generate zip files
const FOLDERS = (Object.keys(EXT) as Array<keyof typeof EXT>).map(key => {
  const value = EXT[key]
  return value.path
})

FOLDERS.forEach(path => {
  // execSync(`zip -r ${path}/built.zip ${path}/*`)
  exec(
    `cd ${path} && zip -r poshify_utilities_${packageJson.version}.zip * && cd ..`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`ZIP ERROR: ${error}`)
        return
      }

      if (stderr) {
        console.error(`ZIP STDERR: ${stderr}`)
      }
    }
  )
})

console.log(manifestString)
console.log('Successfull built extension')
