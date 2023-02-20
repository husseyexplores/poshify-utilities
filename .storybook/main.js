const path = require('path')
const tsconfigPaths = require('vite-tsconfig-paths').default
// const { loadConfigFromFile, mergeConfig } = require("vite");

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-actions',
    '@storybook/addon-interactions',
    '@storybook/preset-scss',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-vite',
  },
  features: {
    storyStoreV7: true,
  },

  /**
   * A option exposed by storybook-builder-vite for customising the Vite config.
   * @see https://github.com/eirslett/storybook-builder-vite#customize-vite-config
   */
  viteFinal: async config => {
    config.plugins.push(
      /** @see https://github.com/aleclarson/vite-tsconfig-paths */
      tsconfigPaths({
        // My tsconfig.json isn't simply in viteConfig.root,
        // so I've passed an explicit path to it:
        projects: [path.resolve(path.dirname(__dirname), 'tsconfig.json')],
      })
    )

    return config
  },
  // async viteFinal(config, { configType }) {
  //   const { config: userConfig } = await loadConfigFromFile(
  //     path.resolve(__dirname, '../vite.config.js')
  //   )

  //   return mergeConfig(config, {
  //     ...userConfig,
  //     // manually specify plugins to avoid conflict
  //     plugins: [],
  //   })
  // },
}
