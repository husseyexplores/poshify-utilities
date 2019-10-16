import React from 'react'

import RoutedLink from '../../common/components/RoutedLink'

function Home() {
  return (
    <div>
      <div>
        <RoutedLink as="button" to="/metafields">
          Metafields Editor
        </RoutedLink>
      </div>
      <div>
        <RoutedLink as="button" to="/csv-downloader">
          CSV Downloader
        </RoutedLink>
      </div>
    </div>
  )
}

Home.propTypes = {}

Home.defaultProps = {}

export default Home
