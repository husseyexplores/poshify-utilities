import { ComponentPropsWithoutRef, forwardRef } from 'react'

export const ClearButton = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'>
>(function ClearButton({ className, ...props }, ref) {
  return (
    <button
      type="button"
      className={`Polaris-TextField__ClearButton ${className || ''}`}
      {...props}
      ref={ref}
    >
      <span className="Polaris-Text--root Polaris-Text--bodySm Polaris-Text--regular Polaris-Text--visuallyHidden">
        Clear
      </span>
      <span className="Polaris-Icon Polaris-Icon--colorBase Polaris-Icon--applyColor">
        <span className="Polaris-Text--root Polaris-Text--bodySm Polaris-Text--regular Polaris-Text--visuallyHidden"></span>
        <svg
          viewBox="0 0 20 20"
          className="Polaris-Icon__Svg"
          focusable="false"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-2.293 4.293a1 1 0 0 0-1.414 1.414l2.293 2.293-2.293 2.293a1 1 0 1 0 1.414 1.414l2.293-2.293 2.293 2.293a1 1 0 1 0 1.414-1.414l-2.293-2.293 2.293-2.293a1 1 0 0 0-1.414-1.414l-2.293 2.293-2.293-2.293z"
          ></path>
        </svg>
      </span>
    </button>
  )
})
