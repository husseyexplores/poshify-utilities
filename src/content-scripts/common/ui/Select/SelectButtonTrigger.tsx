import * as React from 'react'

export const SelectButtonTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>(function SelectButtonTrigger({ children, ...buttonProps }, ref) {
  return (
    <div className="Polaris-Select">
      <button
        ref={ref}
        {...buttonProps}
        className={`Polaris-Select__Input text-left ${
          buttonProps.className ?? ''
        }`}
      >
        {children}
      </button>

      <div className="Polaris-Select__Content" aria-hidden="true">
        <span className="Polaris-Select__SelectedOption">{children}</span>

        <span className="Polaris-Select__Icon">
          <span className="Polaris-Icon">
            <span className="Polaris-Text--root Polaris-Text--bodySm Polaris-Text--regular Polaris-Text--visuallyHidden"></span>
            <svg
              viewBox="0 0 20 20"
              className="Polaris-Icon__Svg"
              focusable="false"
              aria-hidden="true"
            >
              <path d="M7.676 9h4.648c.563 0 .879-.603.53-1.014l-2.323-2.746a.708.708 0 0 0-1.062 0l-2.324 2.746c-.347.411-.032 1.014.531 1.014Zm4.648 2h-4.648c-.563 0-.878.603-.53 1.014l2.323 2.746c.27.32.792.32 1.062 0l2.323-2.746c.349-.411.033-1.014-.53-1.014Z"></path>
            </svg>
          </span>
        </span>
      </div>
      <div className="Polaris-Select__Backdrop"></div>
    </div>
  )
})
