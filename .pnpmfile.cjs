// .pnpmfile.cjs
function readPackage(pkg, context) {
  if (pkg.name === '@storybook/react') {
    console.log('deps added')
    const storybookViteDeps = {
      '@storybook/preview-web': '^6.5.10',
      '@storybook/channel-postmessage': '^6.5.10',
      '@storybook/channel-websocket': '^6.5.10',
      '@storybook/client-api': '^6.5.10',
      '@storybook/client-logger': '^6.5.10',
      // This list may change depending on your Storybook (e.g. installed addons)
    }
    pkg.dependencies = {
      ...pkg.dependencies,
      ...storybookViteDeps,
    }
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage,
  },
}
