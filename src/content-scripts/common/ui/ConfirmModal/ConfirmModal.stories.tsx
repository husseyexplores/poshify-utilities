import { useEffect, useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { useArgs } from '@storybook/client-api'

import { ConfirmModal } from './ConfirmModal'

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Example/Confirm Modal',
  component: ConfirmModal,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof ConfirmModal>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof ConfirmModal> = args => {
  const [_, updateArgs] = useArgs()

  const open = () => updateArgs({ ...args, open: true })
  const close = () => updateArgs({ ...args, open: false })

  return (
    <div>
      <button onClick={open}>Delete this thing</button>
      <ConfirmModal {...args} onConfirm={close} onCancel={close}>
        <p>You reallllly sure??</p>
        <p>Text 2</p>
        <p>Text 3</p>
      </ConfirmModal>
    </div>
  )
}

export const Default = Template.bind({})
Default.args = {
  open: false,
  title: 'Please confirm',
  onCancel: () => console.log('Cancelled'),
  onConfirm: () => console.log('Confirmed'),
  cancelButtonText: 'No, cancel',
  confirmButtonText: 'Please, go ahead',
  destructive: true,
}
