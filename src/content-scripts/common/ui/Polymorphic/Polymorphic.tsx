import { forwardRef } from 'react'

type AsProp<C extends React.ElementType> = {
  _as?: C
  _skip?: null | boolean
}

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P)

// This is the first reusable type utility we built
type PolymorphicComponentProp<
  C extends React.ElementType,
  Props = {}
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>

// This is a new type utitlity with ref!
type PolymorphicComponentPropWithRef<
  C extends React.ElementType,
  Props = {}
> = PolymorphicComponentProp<C, Props> & { ref?: PolymorphicRef<C> }

// This is the type for the "ref" only
type PolymorphicRef<C extends React.ElementType> =
  React.ComponentPropsWithRef<C>['ref']

type PolymorphicProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, {}>

type PolymorphicComponent = <C extends React.ElementType = 'span'>(
  props: PolymorphicProps<C>
) => React.ReactElement | React.ReactNode | null

export const Polymorphic: PolymorphicComponent = forwardRef(
  <C extends React.ElementType = 'div'>(
    { _as, children, _skip = false, ...rest }: PolymorphicProps<C>,
    ref?: PolymorphicRef<C>
  ) => {
    if (_skip && children) return (children ?? null) as any

    const Component = _as || 'div'

    return (
      <Component {...rest} ref={ref}>
        {children}
      </Component>
    )
  }
)
