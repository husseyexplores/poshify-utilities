import { forwardRef, ComponentPropsWithoutRef, useId } from 'react'
import { Icon } from '@shopify/polaris'
import { CircleAlertMajor } from '@shopify/polaris-icons'
import './InlineError.scss'

type ElementProps = ComponentPropsWithoutRef<'div'>
type Props = ElementProps & { size?: 'xs' | 'sm' | 'lg' }

export const InlineError = forwardRef<HTMLInputElement, Props>(function Input(
  { size = 'sm', ...props },
  forwardedRef
) {
  return (
    <div ref={forwardedRef} className="Polaris-Labelled__Error">
      <div id={props.id} className="Polaris-InlineError">
        <div
          className="Polaris-InlineError__Icon Poshify-Icon"
          data-size={size}
        >
          <Icon source={CircleAlertMajor} />
        </div>
        {props.children}
      </div>
    </div>
  )
})
