import clsx from 'clsx'
import { Spinner as PolarisSpinner } from '@shopify/polaris'
import './Spinner.scss'

function Spinner({
  centered = true,
  size = 'small',
}: {
  centered?: boolean
  size?: 'large' | 'small'
}) {
  return (
    <div className={clsx('Custom-Spinner', { 'Centered-Spinner': centered })}>
      <PolarisSpinner size={size} />
    </div>
  )
}

export default Spinner
