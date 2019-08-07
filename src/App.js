import React from 'react'
import ApolloClient, { gql } from 'apollo-boost'
import { Page, Card, Button } from '@shopify/polaris'

import { shopifyConfig } from './secret'

// ------------------------------------------------------------------------------
const client = new ApolloClient({
  uri: `https://${shopifyConfig.API_KEY}:${shopifyConfig.API_SECRET}@${shopifyConfig.SHOP_NAME}.myshopify.com/admin/api/2019-07/graphql.json`,
})

client
  .query({
    query: gql`
      query {
        shop {
          name
          primaryDomain {
            url
            host
          }
        }
      }
    `,
  })
  .then(result => console.log(result))

// https://hssn09dev.myshopify.com/admin/api/2019-07/graphql.json
// 'X-Shopify-Access-Token': shopifyConfig.API_PW
// 'Content-Type': 'application/graphql'

function App() {
  return (
    <Page title="Example app">
      <Card sectioned>
        <Button onClick={() => alert(shopifyConfig.API_PW)}>
          Example button
        </Button>
      </Card>
    </Page>
  )
}

export default App
