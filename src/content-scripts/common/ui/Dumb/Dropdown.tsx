import { ComponentPropsWithoutRef, forwardRef } from 'react'
import clsx from 'clsx'

type DropdownItemNativeProps = ComponentPropsWithoutRef<'button'>
type DropdownItemCompProps = {
  highlighted?: boolean
  selected?: boolean
  disabled?: boolean
  separator?: 'top' | 'bottom'
}
type DropdownItemProps = DropdownItemNativeProps & DropdownItemCompProps
export const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
  function DropdownItem(
    {
      highlighted = false,
      selected = false,
      disabled,
      className,
      separator,
      children,
      ...props
    },
    ref
  ) {
    return (
      <button
        tabIndex={-1}
        type="button"
        disabled={disabled}
        className={clsx(
          separator === 'top' && 'border-t',
          separator === 'bottom' && 'border-b',
          'block w-full text-left',
          highlighted && 'font-bold bg-[var(--p-surface-hovered)]',
          selected &&
            'font-bold bg-[var(--p-surface-success-subdued)] text-[var(--p-text-success)]',
          className
        )}
        {...props}
        role="listitem"
        ref={ref}
      >
        {children}
      </button>
    )
  }
)

export const AriaPresentation = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>(({ children, ...props }, ref) => (
  <div {...props} role="presentation" ref={ref}>
    {children}
  </div>
))

type DropdownNativeProps = ComponentPropsWithoutRef<'div'>
type DropdownCompProps = {
  alwaysRender?: boolean
  isOpen: boolean
  title?: string | null
}
type DropdownProps = DropdownNativeProps & DropdownCompProps
export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  function Dropdown(
    { title, isOpen, alwaysRender = true, children, ...props },
    ref
  ) {
    if (!isOpen && !alwaysRender) return null

    return (
      <div
        className="relative w-full top-0 absolute"
        style={{ visibility: isOpen ? 'visible' : 'hidden' }}
      >
        <div
          className={clsx('Polaris-PositionedOverlay w-full', {
            'Polaris-Card': isOpen,
          })}
        >
          {title && (
            <p className="px-4 py-2 text-xs text-gray-500 border-b bg-slate-50">
              {title}
            </p>
          )}
          <div {...props} ref={ref} role="list">
            {children}
          </div>
        </div>
      </div>
    )
  }
)
