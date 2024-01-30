import {
  ComponentPropsWithoutRef,
  forwardRef,
  useCallback,
  useState,
} from 'react'
import { Icon } from '@shopify/polaris'
import { SearchIcon } from '@shopify/polaris-icons'
import { Input } from './Input'
import { useDebouncedValue, useLiveRef, useUpdateEffect } from '$common/hooks'
import './SearchInput.scss'

type InputElementProps = Omit<ComponentPropsWithoutRef<'input'>, 'prefix'>
type ComponentProps = {
  onTermChange: (value: string) => void
  label?: string
  loading?: boolean
  debouncedBy?: number
}

type InputComponentProps = InputElementProps & ComponentProps

export const SearchInput = forwardRef<HTMLInputElement, InputComponentProps>(
  function SearchInput(
    {
      label = 'Search',
      onTermChange,
      loading = false,
      debouncedBy = 200,
      ...props
    },
    ref
  ) {
    const [value, setValue] = useState('')
    const clearValue = useCallback(() => setValue(''), [])
    const onChangeHandler = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value)
      },
      []
    )

    const deboucedTerm = useDebouncedValue(value, debouncedBy)
    const onTermChangeRef = useLiveRef(onTermChange)

    useUpdateEffect(() => {
      onTermChangeRef.current(deboucedTerm)
    }, [deboucedTerm, onTermChangeRef])

    return (
      <div className="PoshifySearchInput">
        <Input
          autoComplete="off"
          labelHidden
          label={label}
          prefix={<Icon source={SearchIcon} />}
          placeholder={label}
          value={value}
          onChange={onChangeHandler}
          onClearClick={clearValue}
          ref={ref}
          {...props}
        />
        <div className="PoshifySearchInput__Loader" aria-busy={loading}>
          <div className="frame">
            <div className="box">
              <div className="Polaris-Stack Polaris-Stack--alignmentCenter">
                <div className="Polaris-Stack__Item">
                  <span className="Polaris-Spinner Polaris-Spinner--sizeSmall">
                    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.229 1.173a9.25 9.25 0 1011.655 11.412 1.25 1.25 0 10-2.4-.698 6.75 6.75 0 11-8.506-8.329 1.25 1.25 0 10-.75-2.385z"></path>
                    </svg>
                  </span>
                  <span role="status">
                    <span className="Polaris-VisuallyHidden"></span>
                  </span>
                </div>
                <div className="Polaris-Stack__Item">
                  <div>Loading ...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
