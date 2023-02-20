import { SkeletonThumbnail, SkeletonBodyText } from '@shopify/polaris'
import { range } from '$utils'

function SkeletonResourceList({ rows = 9 }: { rows: number }) {
  return (
    <>
      {range(0, rows).map(num => (
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
              <SkeletonBodyText lines={1} />
            </div>
            <div style={{ maxWidth: '150px' }}>
              <SkeletonBodyText lines={1} />
            </div>
          </div>

          <div style={{ width: '45%' }}>
            <div style={{ maxWidth: '200px' }}>
              <SkeletonBodyText lines={1} />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default SkeletonResourceList
