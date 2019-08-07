import React from 'react'
import ApolloClient, { gql } from 'apollo-boost'
import { Page, Card, Button } from '@shopify/polaris'

import { shopifyConfig } from './secret'

// ------------------------------------------------------------------------------

// https://hssn09dev.myshopify.com/admin/api/2019-07/graphql.json
//
// 'Content-Type': 'application/graphql'

function App() {
  const client = new ApolloClient({
    uri: `https://${shopifyConfig.SHOP_NAME}.myshopify.com/admin/api/2019-07/graphql`,
    fetchOptions: {
      headers: {
        'Content-Type': 'application/graphql',
        'X-Shopify-Access-Token': shopifyConfig.API_PW,
      },
    },
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
