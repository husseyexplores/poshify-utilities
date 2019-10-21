import React from 'react'
import { Card, Stack } from '@shopify/polaris'

import RoutedLink from '../../common/components/RoutedLink'

function Home() {
  return (
    <Card>
      <Card.Section>
        <Stack vertical spacing="extraLoose">
          <Stack.Item>
            <RoutedLink as="button" to="/metafields">
              Metafields Editor
            </RoutedLink>
          </Stack.Item>
          <Stack.Item>
            <RoutedLink as="button" to="/csv-downloader">
              CSV Downloader
            </RoutedLink>
          </Stack.Item>
        </Stack>
      </Card.Section>
    </Card>
  )
}

Home.propTypes = {}

Home.defaultProps = {}

export default Home
