/// <reference types="vitest" />
import { resolve, extname } from 'path'
import { readFileSync } from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import monacoEditorPlugin from 'vite-plugin-monaco-editor'

import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

/* eslint-disable no-unused-vars */
const { APP_ENV } = process.env
const DEV = APP_ENV === 'development'
const PREVIEW = APP_ENV === 'preview'
const PROD = APP_ENV === 'production'
const TEST = !!process.env.VITEST
/* eslint-enable no-unused-vars */

const DEBUG = true
const noop = () => {}
const console = new Proxy(globalThis.console, {
  get: (t, prop) => (DEBUG ? t[prop] : noop),
})

/** @typedef {import('vite').UserConfig} ViteConf */
/** @typedef {import('vite').PluginOption} PluginOpt */

const SH_ENV = {
  NAME: process.env.SHOPIFY_SHOP_NAME,
  VER: process.env.VITE_SHOPIFY_API_VER,
  AT: process.env.SHOPIFY_ACCESS_TOKEN,
}

console.log('\nShopify env variables')
console.table(SH_ENV)

/** @type {ViteConf["server"]} */
const serverOptions = {
  port: 3000,
  proxy: {
    [`/admin/api/${SH_ENV.VER}`]: {
      secure: false,
      changeOrigin: true,
      target: `https://${SH_ENV.NAME}.myshopify.com`,
      headers: {
        'X-Shopify-Access-Token': SH_ENV.AT,
      },
    },
  },
}

/** @type {ViteConf["build"]} */
const buildOptions =
  DEV || TEST
    ? {}
    : {
        target: 'es2020',
        minify: true,
        rollupOptions: {
          output: {
            format: 'iife',
          },
          // input: {
          //   content: './src/content-scripts/build-entry.ts',
          // },
          // output: {
          //   entryFileNames: `assets/[name].js`,
          //   chunkFileNames: `assets/[name].js`,
          //   assetFileNames: `assets/[name].[ext]`,
          // },
          // output: {
          //   entryFileNames: 'src/pages/[name]/index.js',
          //   chunkFileNames: 'assets/js/[name].[hash].js',
          //   assetFileNames: assetInfo => {
          //     const { dir, name: _name } = path.parse(assetInfo.name)
          //     const assetFolder = dir.split('/').at(-1)
          //     const name = assetFolder + firstUpperCase(_name)
          //     return `assets/[ext]/${name}.chunk.[ext]`
          //   },
          // },
        },
      }
/* @ts-check */
/**
 * @type {import('vite').UserConfigFn} options
 */
export default async ({ mode }) => {
  console.log({ mode, APP_ENV, TEST })

  return defineConfig({
    plugins: [
      // monacoEditorPlugin({
      //   languageWorkers: [
      //     'editorWorkerService',
      //     'css',
      //     'html',
      //     'json',
      //     'typescript',
      //   ],
      // }),
      plainTextLoader({
        ext: 'svg',
      }),
      react(),
      // PROD && crx({ manifest }),
    ].filter(Boolean),
    server: serverOptions,
    resolve: {
      alias: {
        $utils: resolve(__dirname, './src/utils'),
        $lib: resolve(__dirname, './src/lib'),
        $common: resolve(__dirname, './src/content-scripts/common'),
        $ui: resolve(__dirname, './src/content-scripts/common/ui'),
        $hooks: resolve(__dirname, './src/content-scripts/common/hooks'),
        '$query-clients': resolve(
          __dirname,
          './src/content-scripts/query-clients.ts'
        ),
        $router: resolve(__dirname, './src/content-scripts/router'),
        $queries: resolve(__dirname, './src/content-scripts/queries'),
        $routes: resolve(__dirname, './src/content-scripts/routes'),
        $gql: resolve(__dirname, './src/content-scripts/generated/graphql.tsx'),
        $types: resolve(__dirname, './src/content-scripts/types'),
      },
    },
    build: buildOptions,
    define: {
      'process.env': {},
      __DEV__: DEV,
    },
    test: {
      environment: 'jsdom',
    },
  })
}

// ---------------------------------------
// Plugins
// ---------------------------------------

/**
 *
 * @param {object} options
 * @param {string|RegExp|string[]|RegExp[]|Function} options.ext
 * @param {string|RegExp|string[]|RegExp[]|Function} options.path
 * @returns {PluginOpt}
 */
function plainTextLoader(opts = {}) {
  function tryMatching(match, against, fnArgs = []) {
    const type = typeof match

    return (
      (type === 'string' && match === against) ||
      (type === 'string' && new RegExp(match).test(against)) ||
      (match instanceof RegExp && match.test(against)) ||
      (type === 'function' && match.apply(this, fnArgs)) ||
      (Array.isArray(match) && match.some(m => tryMatching(m, against, fnArgs)))
    )
  }

  return {
    transform(code, id) {
      // Try matching with extension
      let canTransform =
        opts.ext && tryMatching(opts.ext, extname(id), [code, id])

      if (!canTransform && opts.path) {
        canTransform = tryMatching(opts.path, id, [code, id])
      }

      if (canTransform) {
        const fileContents = readFileSync(id, 'utf-8')
        return `export default ${JSON.stringify(fileContents)}`
      }
    },
  }
}
