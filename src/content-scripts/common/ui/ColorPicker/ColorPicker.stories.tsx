import { ComponentStory, ComponentMeta } from '@storybook/react'
import { useArgs } from '@storybook/client-api'

import { ColorPicker } from './ColorPicker'

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Example/ColorPicker',
  component: ColorPicker,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    color: {
      control: {
        type: 'color',
      },
    },
    defaultColor: {
      control: {
        type: 'color',
      },
    },
    onChange: {
      table: {
        disable: true,
      },
    },
  },
} as ComponentMeta<typeof ColorPicker>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof ColorPicker> = args => {
  const [, updateArgs] = useArgs()

  const onChange = next => {
    args.onChange?.(next)
    updateArgs({ ...args, color: next })
  }

  return <ColorPicker {...args} onChange={onChange} />
}
export const Controlled = Template.bind({})
Controlled.args = {
  color: '#ff0000',
  onChangeFireDelay: 0,
  onChange: console.log,
}

// ---------------------------

export const Uncontrolled: ComponentStory<typeof ColorPicker> = args => (
  <ColorPicker {...args} />
)
Uncontrolled.args = {
  defaultColor: '#ff0000',
  onChangeFireDelay: 20,
  onChange: console.log,
}
