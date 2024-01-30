import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  useMotionValue,
  Reorder,
  useDragControls,
  animate,
  MotionValue,
  DraggableProps,
} from 'framer-motion'
import { Icon } from '@shopify/polaris'
import { DragHandleIcon } from '@shopify/polaris-icons'
import clsx from 'clsx'
import { ClearButton } from '$ui/Dumb'
import './ReorderStyles.scss'

/* eslint-disable @typescript-eslint/no-use-before-define */
type AnyFunc = (...args: any) => any
export function Item<TValue>({
  value,
  children,
  id,
  onRemove,
  drag,
}: {
  drag?: DraggableProps['drag']
  value: TValue
  id?: string
  children: ReactNode
  onRemove?: (item: TValue) => any
  onChange?: AnyFunc
}) {
  // const y = useMotionValue(0)
  // const boxShadow = useRaisedShadow(y)
  const dragControls = useDragControls()

  const [anim, setAnim] = useState(false)
  const canDrag = drag !== false
  const animating = useMemo(
    () => ({
      start: () => canDrag && setAnim(true),
      stop: () => canDrag && setAnim(false),
    }),
    [canDrag]
  )

  return (
    <Reorder.Item
      className={clsx(
        canDrag && 'DragItem',
        canDrag && anim && 'DragItem--Dragging'
      )}
      value={value}
      id={id}
      drag={drag}
      // style={{ boxShadow }}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={animating.start}
      onDragEnd={animating.stop}
      // animate={false}
    >
      <div className={`${canDrag ? 'DragItem__Inner' : ''}`}>
        {canDrag && (
          <button type="button" onPointerDown={e => dragControls.start(e)}>
            {dragHandleIconJsx}
          </button>
        )}

        <div className="DragItem__Content">{children}</div>
        {canDrag && onRemove && (
          <ClearButton
            className="DragItem__DeleteIcon"
            type="button"
            aria-label={`Remove item`}
            onClick={() => {
              onRemove(value)
            }}
          >
            {deleteIconJsx}
          </ClearButton>
        )}
      </div>
    </Reorder.Item>
  )
}

export const Group = (props: React.ComponentProps<typeof Reorder.Group>) => {
  return (
    <Reorder.Group
      {...props}
      className={`DragItems ${props.className || ''}`}
    />
  )
}

const inactiveShadow = '0px 0px 0px rgba(0,0,0,0.1)'

function useRaisedShadow(value: MotionValue<number>) {
  const boxShadow = useMotionValue(inactiveShadow)

  useEffect(() => {
    let isActive = false
    return value.on('change', latestValue => {
      const wasActive = isActive
      if (latestValue !== 0) {
        isActive = true
        if (isActive !== wasActive) {
          animate(boxShadow, '3px 3px 8px rgba(0,0,0,0.2)')
        }
      } else {
        isActive = false
        if (isActive !== wasActive) {
          animate(boxShadow, inactiveShadow)
        }
      }
    })
  }, [value, boxShadow])

  return boxShadow
}

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={3}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}

const deleteIconJsx = <DeleteIcon className="DragItem__DeleteIcon" />
const dragHandleIconJsx = <Icon source={DragHandleIcon} tone="base" />
