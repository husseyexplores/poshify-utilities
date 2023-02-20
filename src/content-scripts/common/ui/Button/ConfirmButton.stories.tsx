import * as React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { useArgs } from '@storybook/client-api'

import { ConfirmButton } from './ConfirmButton'

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Example/ConfirmButton',
  component: ConfirmButton,
  argTypes: {
    countDown: {
      type: 'number',
      defaultValue: 0,
      name: 'Enable count-down timer',
    },
  },
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as ComponentMeta<typeof ConfirmButton>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof ConfirmButton> = args => {
  // const [, updateArgs] = useArgs()
  const cd = args.countDownSeconds

  const [deleting, setDeleting] = React.useState(false)
  const ref = React.useRef<HTMLButtonElement>(null)

  return (
    <ConfirmButton
      countDownSeconds={args.countDownSeconds}
      onStatusChange={({ status, proceed }) => {
        if (status === 'confirmed') {
          setDeleting(true)
          setTimeout(() => {
            setDeleting(false)
            proceed()
          }, 1000)
        }
      }}
    >
      {({ status, proceed, cancel, timer }) => (
        <button onClick={proceed} ref={ref} disabled={deleting}>
          {status === 'pending'
            ? `Are you sure? ${cd != null && cd > 0 ? `(${timer})` : ''}`
            : status === 'confirmed' || deleting
            ? 'Deleting...'
            : 'Delete'}
        </button>
      )}
    </ConfirmButton>
  )
}
export const Default = Template.bind({})

// ---------------------------

export const WithTimer = Template.bind({})
WithTimer.args = {
  countDownSeconds: 5,
}
