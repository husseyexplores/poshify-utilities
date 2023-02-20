import { ReactNode, useCallback, useRef } from 'react'
import {
  Button as PolarisBtn,
  ButtonProps as PolarisBtnProps,
  LinkProps as PolarisLinkProps,
  Link as PolarisLink,
} from '@shopify/polaris'
import { LinkProps, useResolvedPath, useMatch, useNavigate } from '$router'
import * as R from 'remeda'

type RoutedLinkAs = 'link' | 'a' | 'button'
type RouteLinkAsComponentProps<TAs extends string> = TAs extends 'button'
  ? PolarisBtnProps
  : TAs extends 'link'
  ? PolarisLinkProps
  : TAs extends 'a'
  ? React.ComponentPropsWithoutRef<'a'>
  : {}

type RoutedLinkProps<TAs extends RoutedLinkAs> =
  RouteLinkAsComponentProps<TAs> &
    Omit<LinkProps, 'to'> & {
      to: LinkProps['to'] | null | undefined
      as?: TAs
      disabled?: boolean
      activeProps?: React.ComponentPropsWithoutRef<'button'>
    }

function getElementType<TAs extends RoutedLinkAs>(as: TAs) {
  if (as === 'a') return 'a'
  if (as === 'button') return PolarisBtn
  if (as === 'link') return PolarisLink

  return PolarisLink
}

function RoutedLink<TAs extends RoutedLinkAs>({
  as,
  to: toProp = '',
  onClick,
  children,
  replace = false,
  preventScrollReset = false,
  relative = 'route',
  activeProps,
  ...restProps
}: RoutedLinkProps<TAs>) {
  const to = toProp || ''
  const resolved = useResolvedPath(to)
  const isActive = useMatch({ path: resolved.pathname, end: true })

  const navigate = useNavigate()
  const savedOnClick = useRef(onClick)
  savedOnClick.current = onClick

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      savedOnClick.current?.(e)
      if (e.isDefaultPrevented()) return
      navigate(to, {
        replace,
        preventScrollReset,
        relative,
      })
    },
    [to]
  )

  const ElementType = getElementType(as || 'link')

  const mergedRestProps =
    activeProps && isActive ? R.merge(restProps, activeProps) : restProps
  return (
    <ElementType {...(mergedRestProps as any)} onClick={handleClick}>
      {children}
    </ElementType>
  )
}

export default RoutedLink
