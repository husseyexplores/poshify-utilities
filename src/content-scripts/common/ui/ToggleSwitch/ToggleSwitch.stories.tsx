import { ComponentStory, ComponentMeta } from '@storybook/react'

import { ToggleSwitch } from './ToggleSwitch'

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Example/Toggle Switch',
  component: ToggleSwitch,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof ToggleSwitch>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof ToggleSwitch> = args => (
  <ToggleSwitch {...args} />
)

export const Controlled = Template.bind({})
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Controlled.args = {
  label: 'Switch',
  checked: true,
  disabled: false,
  color: '',
}

export const Uncontrolled = Template.bind({})
Uncontrolled.args = {
  label: 'Uncontrolled',
  initialChecked: false,
  disabled: false,
  color: '',
}
