import {
  useCallback,
  useId,
  useRef,
  useState,
  forwardRef,
  ComponentPropsWithoutRef,
  useEffect,
} from 'react'
import { HexColorPicker } from 'react-colorful'
import { useClickOutside, useEventCallback } from '$hooks'
import './ColorPicker.scss'

function debounce<T extends (...args: any[]) => any>(fn: T, ms = 20) {
  if (Math.max(0, Math.trunc(ms)) <= 0) return fn

  let timeoutId: ReturnType<typeof setTimeout>
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), ms)
  }
}

const HASH_PREFIX = true
const VALID_HEX_LEN = HASH_PREFIX ? 7 : 6

const ensureSixLetterHex = (hex: string, prefixed = HASH_PREFIX) => {
  // already valid
  if (hex.length === (prefixed ? 7 : 6)) return hex

  const rawHex = prefixed ? hex.slice(1) : hex
  const rawHexLen = rawHex.length
  if (rawHexLen === 6) return prefixed ? `#${rawHex}` : rawHex

  if (rawHexLen !== 3) throw new Error('Must be three or 6 letter hex')

  // Repeat each char twice
  let fixedHex = ''
  for (let i = 0; i < rawHexLen; i++) {
    const char = rawHex[i]
    fixedHex += char + char
  }

  return prefixed ? `#${fixedHex}` : fixedHex
}

type InputElementProps = Omit<ComponentPropsWithoutRef<'input'>, 'onChange'>
type ComponentProps = {
  color?: string
  defaultColor?: string
  onChange?: (color: string) => any
  onChangeFireDelay?: number
}

type ColorPickerProps = Omit<InputElementProps, 'type'> & ComponentProps

export const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  function ColorPicker(
    {
      defaultColor = '#000000',
      color: controlledColor,
      onChange,
      onChangeFireDelay = 20,
      onBlur,
      name,
      ...props
    },
    ref
  ) {
    const ourRef = useRef<HTMLInputElement | null>(null)
    const isControlled = useRef(controlledColor != null).current
    const [internalColor, setInternalColor] = useState(defaultColor)
    const color = isControlled ? controlledColor : internalColor

    const popover = useRef<HTMLDivElement>(null)
    const btn = useRef<HTMLButtonElement>(null)

    const triggerBtnId = useId()
    const [isOpen, setIsOpen] = useState(false)
    const toggle = () => setIsOpen(x => !x)

    const stableOnBlur = useEventCallback(onBlur)
    const close = useCallback(() => {
      setIsOpen(false)
      // if(ref?.current) {
      //   stableOnBlur({ target: ref?.current })
      // }
    }, [stableOnBlur])
    useClickOutside(popover, close)

    const stableOnChangeProp = useEventCallback(onChange)
    const handleOnChange = useCallback(
      debounce((newColor: string) => {
        if (newColor.length !== VALID_HEX_LEN) return
        // const sixLetterHex = ensureSixLetterHex(newColor)
        stableOnChangeProp?.(newColor)

        if (!isControlled) {
          setInternalColor(newColor)
        }
      }, onChangeFireDelay),
      [stableOnChangeProp, setInternalColor]
    )

    return (
      <div className="PoshColorPicker">
        <div className="Polaris-TextField">
          <HexColorInput
            name={name}
            color={color}
            onChange={handleOnChange}
            className="Polaris-TextField__Input"
            prefixed={HASH_PREFIX}
            onBlur={stableOnBlur}
            ref={ref}
            {...props}
          />
          <div className="Polaris-TextField__Backdrop"></div>
        </div>

        <button
          ref={btn}
          data-outside-click-allow={triggerBtnId}
          className="PoshColorPicker__Preview"
          type="button"
          onClick={toggle}
          style={{ backgroundColor: color }}
        ></button>

        {isOpen && (
          <div ref={popover} className="PoshColorPicker__Wrapper">
            <button type="button" className="PoshColorPicker__Button">
              <HexColorPicker onChange={handleOnChange} color={color} />
            </button>
          </div>
        )}
      </div>
    )
  }
)

// ------------------------------------------------------
// Clone from 'react-colorful' packages to with forwardRef support

type ColorInputHTMLAttributes = Omit<
  ComponentPropsWithoutRef<'input'>,
  'onChange' | 'value'
>
type ColorInputBaseProps = ColorInputHTMLAttributes & {
  color?: string
  onChange?: (newColor: string) => void
}
type ColorInputProps = ColorInputBaseProps & {
  /** Blocks typing invalid characters and limits string length */
  escape: (value: string) => string
  /** Checks that value is valid color string */
  validate: (value: string) => boolean
  /** Processes value before displaying it in the input */
  format?: (value: string) => string
  /** Processes value before sending it in `onChange` */
  process?: (value: string) => string
}
const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  function ColorInput(props, ref) {
    const {
      color = '',
      onChange,
      onBlur,
      escape,
      validate,
      format,
      process,
      ...rest
    } = props
    const [value, setValue] = useState(() => escape(color))
    const onChangeCallback = useEventCallback(onChange)
    const onBlurCallback = useEventCallback(onBlur)

    // Trigger `onChange` handler only if the input value is a valid color
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = escape(e.target.value)
        setValue(inputValue)
        if (validate(inputValue))
          onChangeCallback(process ? process(inputValue) : inputValue)
      },
      [escape, process, validate, onChangeCallback]
    )

    // Take the color from props if the last typed color (in local state) is not valid
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        if (!validate(e.target.value)) setValue(escape(color))
        onBlurCallback(e)
      },
      [color, escape, validate, onBlurCallback]
    )

    // Update the local state when `color` property value is changed
    useEffect(() => {
      setValue(escape(color))
    }, [color, escape])

    return (
      <input
        {...rest}
        value={format ? format(value) : value}
        spellCheck="false" // the element should not be checked for spelling errors
        onChange={handleChange}
        onBlur={handleBlur}
        ref={ref}
      />
    )
  }
)

const matcher = /^#?([0-9A-F]{3,8})$/i

const validHex = (value: string, alpha?: boolean): boolean => {
  const match = matcher.exec(value)
  const length = match ? match[1].length : 0

  return (
    length === 3 || // '#rgb' format
    length === 6 || // '#rrggbb' format
    (!!alpha && length === 4) || // '#rgba' format
    (!!alpha && length === 8) // '#rrggbbaa' format
  )
}

type HexColorInputProps = ColorInputBaseProps & {
  /** Enables `#` prefix displaying */
  prefixed?: boolean
  /** Allows `#rgba` and `#rrggbbaa` color formats */
  alpha?: boolean
}

/** Adds "#" symbol to the beginning of the string */
const prefix = (value: string) => '#' + value

const HexColorInput = forwardRef<HTMLInputElement, HexColorInputProps>(
  function HexColorInput(props, ref) {
    const { prefixed, alpha, ...rest } = props

    /** Escapes all non-hexadecimal characters including "#" */
    const escape = useCallback(
      (value: string) =>
        value.replace(/([^0-9A-F]+)/gi, '').substring(0, alpha ? 8 : 6),
      [alpha]
    )

    /** Validates hexadecimal strings */
    const validate = useCallback(
      (value: string) => validHex(value, alpha),
      [alpha]
    )

    return (
      <ColorInput
        {...rest}
        escape={escape}
        format={prefixed ? prefix : undefined}
        process={prefix}
        validate={validate}
        ref={ref}
      />
    )
  }
)
