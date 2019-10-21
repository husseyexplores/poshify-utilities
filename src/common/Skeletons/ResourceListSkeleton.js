import React from 'react'
import { SkeletonThumbnail, SkeletonBodyText } from '@shopify/polaris'
import { rangeNum } from '../../utils'

function SkeletonResourceList({ rows } = {}) {
  if (rows - 1 <= 0) {
    throw new Error(
      '[SkeletonResourceList] - prop `rows` cannot be less than 1'
    )
  }

  return rangeNum(rows ? rows - 1 : 9).map(num => (
    <div
      key={num + 'results-row-sekel'}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1.6rem',
        borderBottom: '0.1rem solid #f4f6f8',
      }}
    >
      <div style={{ width: '10%' }}>
        <SkeletonThumbnail size="small" />
      </div>
      <div style={{ width: '45%' }}>
        <div style={{ maxWidth: '200px', marginBottom: '10px' }}>
          <SkeletonBodyText size="small" lines={1} />
        </div>
        <div style={{ maxWidth: '150px' }}>
          <SkeletonBodyText size="small" lines={1} />
        </div>
      </div>

      <div style={{ width: '45%' }}>
        <div style={{ maxWidth: '200px' }}>
          <SkeletonBodyText size="small" lines={1} />
        </div>
      </div>
    </div>
  ))
}

export default SkeletonResourceList
