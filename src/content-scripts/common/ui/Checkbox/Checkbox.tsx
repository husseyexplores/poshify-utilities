import { CSSProperties, memo } from 'react'
import { Checkbox as PolarisCheckbox, CheckboxProps } from '@shopify/polaris'

type Props = CheckboxProps & {
  color?: string
  className?: string
  title?: string
}

export function Checkbox({
  color,
  title: titleProp,
  className,
  ...props
}: Props) {
  const style = color
    ? ({ '--p-interactive': color } as CSSProperties)
    : undefined
  const title = titleProp
    ? titleProp
    : typeof props.label === 'string'
    ? props.label
    : undefined

  return (
    <div className={className} style={style} title={title}>
      <PolarisCheckbox {...props} />
    </div>
  )
}

export const CheckboxMemoized = memo(
  PolarisCheckbox,
  function areEqual(prev, next) {
    const sameLabels = prev.label === next.label
    const sameChecked = prev.checked === next.checked

    return sameLabels && sameChecked
  }
)

CheckboxMemoized.displayName = 'CheckboxMemoized'
