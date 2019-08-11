const proxy = require('http-proxy-middleware')

module.exports = function(app) {
  app.use(
    proxy('/admin', {
      target: `https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/`,
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_SHOP_PW,
      },
      secure: false,
      changeOrigin: true,
    })
  )
}
