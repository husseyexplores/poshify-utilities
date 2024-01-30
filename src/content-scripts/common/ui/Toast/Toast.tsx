import { Icon, IconSource, Spinner } from '@shopify/polaris'
import {
  AlertCircleIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
} from '@shopify/polaris-icons'
import { ReactNode } from 'react'
import './ToastStyle.scss'

type ToastProps = {
  message: string | ReactNode
  type?: 'error' | 'success' | 'warning' | 'info' | 'loading'
  icon?: 'error' | 'success' | 'warning' | 'info' | IconSource
  onClose?: () => any
  onMouseOver?: () => any
  onMouseOut?: () => any
}
const ICONS = {
  error: AlertCircleIcon,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
} as const

const errClass = 'Polaris-Frame-Toast--error'
const closeIconMarkup = (
  <>
    <span className="Polaris-VisuallyHidden"></span>
    <svg
      viewBox="0 0 20 20"
      className="Polaris-Icon__Svg"
      focusable="false"
      aria-hidden="true"
    >
      <path d="M6.707 5.293a1 1 0 0 0-1.414 1.414l3.293 3.293-3.293 3.293a1 1 0 1 0 1.414 1.414l3.293-3.293 3.293 3.293a1 1 0 0 0 1.414-1.414l-3.293-3.293 3.293-3.293a1 1 0 0 0-1.414-1.414l-3.293 3.293-3.293-3.293Z"></path>
    </svg>
  </>
)

export function Toast({
  message,
  type = 'info',
  icon,
  onClose,
  onMouseOver,
  onMouseOut,
}: ToastProps) {
  const loading = type === 'loading'
  const err = type === 'error'

  if (type !== 'loading' && icon === undefined && ICONS[type])
    icon = ICONS[type]

  return (
    <div
      className={`CustomToast Polaris-Frame-Toast CustomToast--${type} ${
        err ? errClass : ''
      }`}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    >
      {icon ? (
        <div className="Polaris-Frame-Toast__LeadingIcon">
          <Icon source={icon} />
        </div>
      ) : null}

      <div className="Polaris-Inline">
        <div className="Polaris-Text--root Polaris-Text--bodyMd Polaris-Text--medium">
          {message}
        </div>
      </div>
      <button
        type="button"
        className="Polaris-Frame-Toast__CloseButton"
        onClick={loading ? undefined : onClose}
      >
        <span className="Polaris-Icon">
          {loading ? <Spinner size="small" /> : closeIconMarkup}
        </span>
      </button>
    </div>
  )
}
