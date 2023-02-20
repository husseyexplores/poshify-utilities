import { forwardRef, ComponentPropsWithoutRef, useId } from 'react'

type ElementProps = ComponentPropsWithoutRef<'label'>
type Props = ElementProps

export const Label = forwardRef<HTMLLabelElement, Props>(function Label(
  { children, hidden, ...props },
  ref
) {
  const _id = 'poshify_label_' + useId()
  const id = props.id || _id

  return (
    <div className={`${hidden ? 'Polaris-Labelled--hidden' : ''}`}>
      <div className="Polaris-Labelled__LabelWrapper">
        <div className="Polaris-Label">
          <label ref={ref} {...props} id={id} className="Polaris-Label__Text">
            <span className="Polaris-Text--root Polaris-Text--bodyMd Polaris-Text--regular">
              {children}
            </span>
          </label>
        </div>
      </div>
    </div>
  )
})
