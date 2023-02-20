import {
  ReactNode,
  useCallback,
  useId,
  forwardRef,
  ComponentPropsWithRef,
} from 'react'
import * as Switch from '@radix-ui/react-switch'
import { useControllableState, useEventCallback } from '$hooks'
import { Label } from '$ui/Dumb'
import { Indentity } from '$utils'
import './ToggleSwitch.scss'

type Props = {
  checked?: boolean
  initialChecked?: boolean
  getNextState?: (nextDraftState: boolean) => boolean
  onChange?: (boolean) => any

  label?: ReactNode
  id?: string
  color?: string
  disabled?: boolean
}
type _Props = Omit<ComponentPropsWithRef<'button'>, 'type'> & Props

export const ToggleSwitch = forwardRef<HTMLButtonElement, _Props>(
  function ToggleSwitch(
    {
      checked: controlledChecked,
      initialChecked,
      onChange: onChangeProp,
      getNextState = Indentity,
      label,
      id: idProp,
      disabled = false,
      color,
      ...rest
    },
    ref
  ) {
    const stableGetNextState = useEventCallback(getNextState)
    const shouldUpdate = useCallback(
      (prev: boolean, draftNext: boolean) => {
        const nextState = stableGetNextState(draftNext)
        return prev !== nextState
      },
      [stableGetNextState]
    )

    const [checked, setChecked] = useControllableState({
      value: controlledChecked,
      defaultValue: initialChecked,
      onChange: onChangeProp,
      shouldUpdate,
    })

    const _uid = useId()
    const id = idProp || _uid

    const style = color
      ? ({ '--color': color } as React.CSSProperties)
      : undefined

    return (
      <div className="ToggleSwitch" style={style}>
        {label && <Label id={id}>{label}</Label>}
        <Switch.Root
          className="SwitchRoot"
          checked={checked}
          onCheckedChange={setChecked}
          value={checked?.toString()}
          id={id}
          disabled={disabled}
          type="button"
          ref={ref}
          {...rest}
        >
          <Switch.Thumb className="SwitchThumb" id={id} />
        </Switch.Root>
      </div>
    )
  }
)
