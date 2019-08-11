import React from 'react'
import { Page, Card, Button } from '@shopify/polaris'

import SearchWidget from './components/SearchWidget'
import MetafieldTabs from './components/MetafieldTabs'

// ------------------------------------------------------------------------------

function App() {
  return (
    <Page title="Metafields Editor">
      <SearchWidget />

      <Card sectioned>
        <Button>Edit Shop Metafeilds</Button>
      </Card>

      <MetafieldTabs />
    </Page>
  )
}

export default App
