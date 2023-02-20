import {
  useEffect,
  useReducer,
  useState,
  RefObject,
  MutableRefObject,
  Reducer,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import {
  useEvent as useEventCallback,
  useForkRef,
  useLazyValue as useConstant,
  useLiveRef,
  useSafeLayoutEffect,
} from 'ariakit-react-utils'
import { proxy, useSnapshot } from 'valtio'
import { AnyFunction } from '$types'

export function useProxy<T extends object>(initial: T | (() => T)) {
  const state = useConstant(() =>
    proxy<T>(typeof initial === 'function' ? initial() : initial)
  )

  const snap = useSnapshot(state)
  return [snap, state] as const
}

export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [delay, value])

  return debouncedValue
}

export function useInterval(callback: AnyFunction, interval: number) {
  const savedCallback = useLiveRef(callback)

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current?.()
    }

    const id = setInterval(tick, interval)
    return () => clearInterval(id)
  }, [interval])
}

const toggleReducer = (state: boolean, nextValue?: any) =>
  typeof nextValue === 'boolean' ? nextValue : !state

export function useToggle(
  initialValue: boolean
): [boolean, (nextValue?: any) => void] {
  return useReducer<Reducer<boolean, any>>(toggleReducer, initialValue)
}
useToggle.getSuggestedState = toggleReducer

/**
 * Improved version of https://usehooks.com/useOnClickOutside/
 *
 * Example usage:
 * -----------------------
 *
 * import React, { useCallback, useRef, useState } from "react"
 * import { HexColorPicker } from "react-colorful"
 *
 * import useClickOutside from "./useClickOutside"
 *
 * export const PopoverPicker = ({ color, onChange }) => {
 *   const popover = useRef()
 *   const [isOpen, toggle] = useState(false)
 *
 *   const close = useCallback(() => toggle(false), [])
 *   useClickOutside(popover, close)
 *
 *   return (
 *     <div className="picker">
 *       <div
 *         className="swatch"
 *         style={{ backgroundColor: color }}
 *         onClick={() => toggle(true)}
 *       />
 *
 *       {isOpen && (
 *         <div className="popover" ref={popover}>
 *           <HexColorPicker color={color} onChange={onChange} />
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 *
 */
export const useClickOutside = <T extends HTMLElement>(
  ref: RefObject<T | undefined> | MutableRefObject<T | undefined>,
  handler: (event: MouseEvent | TouchEvent) => any,
  allowId?: string
) => {
  const stableHandler = useEventCallback(handler)
  useEffect(() => {
    let startedInside = false
    let startedWhenMounted = false

    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if `mousedown` or `touchstart` started inside ref element
      if (startedInside || !startedWhenMounted) return

      // Do nothing if clicking ref's element or descendent elements
      const target = event.currentTarget
      const isValidTarget = target instanceof HTMLElement
      if (
        !ref.current ||
        (isValidTarget && ref.current.contains(target)) ||
        (allowId &&
          isValidTarget &&
          target.getAttribute('data-outside-click-allow') === allowId)
      )
        return

      stableHandler(event)
    }

    const validateEventStart = event => {
      startedWhenMounted = !!ref.current
      startedInside = !!ref.current && ref.current.contains(event.target)
    }

    document.addEventListener('mousedown', validateEventStart)
    document.addEventListener('touchstart', validateEventStart)
    document.addEventListener('click', listener)

    return () => {
      document.removeEventListener('mousedown', validateEventStart)
      document.removeEventListener('touchstart', validateEventStart)
      document.removeEventListener('click', listener)
    }
  }, [ref])
}

function flashElement(element: HTMLElement) {
  requestAnimationFrame(() => {
    element.style.transition = 'none'
    element.style.color = 'rgba(255,62,0,1)'
    element.style.backgroundColor = 'rgba(255,62,0,0.2)'

    if (!element.dataset.renderCount) {
      element.dataset.renderCount = '0'
    }

    const prev = +element.dataset.renderCount
    element.dataset.renderCount = (prev + 1).toString()

    requestAnimationFrame(() => {
      element.style.transition = 'color 1s, background 1s'
      element.style.color = ''
      element.style.backgroundColor = ''
    })
  })
}

export function useRenderFlash(ref?: RefObject<HTMLElement> | undefined) {
  const internalRef = useRef<HTMLElement | null>()

  useSafeLayoutEffect(() => {
    if (internalRef.current) {
      flashElement(internalRef.current)
    }
  })

  return useForkRef(internalRef, ref)
}

function useCallbackRef<T extends (...args: any[]) => any>(
  callback: T | undefined,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(((...args) => callbackRef.current?.(...args)) as T, deps)
}

/**
 * Given a prop value and state value, the useControllableProp hook is used to determine whether a component is controlled or uncontrolled, and also returns the computed value.
 *
 * @see Docs https://chakra-ui.com/docs/hooks/use-controllable#usecontrollableprop
 */
export function useControllableProp<T>(prop: T | undefined, state: T) {
  const controlled = typeof prop !== 'undefined'
  const value = controlled ? prop : state
  return useMemo<[boolean, T]>(() => [controlled, value], [controlled, value])
}

export interface UseControllableStateProps<T> {
  value?: T
  defaultValue?: T | (() => T)
  onChange?: (value: T) => void
  shouldUpdate?: (prev: T, next: T) => boolean
}

/**
 * The `useControllableState` hook returns the state and function that updates the state, just like React.useState does.
 *
 * @see Docs https://chakra-ui.com/docs/hooks/use-controllable#usecontrollablestate
 */
export function useControllableState<T>(props: UseControllableStateProps<T>) {
  const {
    value: valueProp,
    defaultValue,
    onChange,
    shouldUpdate = (prev, next) => prev !== next,
  } = props

  const onChangeProp = useCallbackRef(onChange)
  const shouldUpdateProp = useCallbackRef(shouldUpdate)

  const [uncontrolledState, setUncontrolledState] = useState(defaultValue as T)
  const controlled = valueProp !== undefined
  const value = controlled ? valueProp : uncontrolledState

  const setValue = useCallbackRef(
    (next: React.SetStateAction<T>) => {
      const setter = next as (prevState?: T) => T
      const nextValue = typeof next === 'function' ? setter(value) : next

      if (!shouldUpdateProp(value, nextValue)) {
        return
      }

      if (!controlled) {
        setUncontrolledState(nextValue)
      }

      onChangeProp(nextValue)
    },
    [controlled, onChangeProp, value, shouldUpdateProp]
  )

  return [value, setValue] as [T, React.Dispatch<React.SetStateAction<T>>]
}

export {
  useLazyValue as useConstant,
  useLiveRef,
  useEvent as useEventCallback,
  usePreviousValue,
  useUpdateEffect,
  useUpdateLayoutEffect,
  useSafeLayoutEffect,
} from 'ariakit-react-utils'
export * from './localStrage'
