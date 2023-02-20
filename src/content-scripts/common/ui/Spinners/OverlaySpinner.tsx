import { ReactNode } from 'react'
import clsx from 'clsx'

function OverlaySpinner({
  loading = false,
  children,
  className,
}: {
  loading: boolean
  children: ReactNode | ReactNode[]
  className: string
}) {
  if (!children) return null

  const wrapperClasses = clsx(
    'centered_loading_wrapper',
    typeof className === 'string' ? className : null,
    {
      is_loading: loading,
    }
  )

  const contentClasses = clsx('centered_loading_content', {
    is_loading: loading,
  })

  return (
    <div className={wrapperClasses}>
      <div className={contentClasses}>{children}</div>
    </div>
  )
}

export default OverlaySpinner
