import * as R from 'remeda'
import { z } from 'zod'
import {
  isJsonString,
  isValidDateString,
  isNumeric,
  isInteger,
  isJsonable,
  JsonStringify,
  safeJsonParse,
  typeOf,
} from './basic'
import { MetafieldType, SearchResultTypes } from '$types'

/*
https://shopify.dev/apps/metafields/types
var MF_SAVABLE_TYPES = [...document.querySelectorAll('table tbody tr')].map(row => {
  // let title = row.querySelector('td:nth-child(1)').textContent.trim().replace(/\s+/g, ' ')
  let type = row.querySelector('td:nth-child(1) code').textContent.trim().replace(/\s+/g, ' ')
  let desc = row.querySelector('td:nth-child(2)').innerHTML.trim().replace(/\s+/g, ' ')
  let example = row.querySelector('td:nth-child(3)').innerHTML.trim().replace(/\s+/g, ' ')
  let d_type = row.querySelector('td:nth-child(4)').textContent.trim().replace(/\s+/g, ' ')

  return {
    title,
    type,
    descriptionHtml: desc,
    exampleHtml: example
  }
})

copy(MF_SAVABLE_TYPES)
*/

const isMetafieldTypeJson = (type: MetafieldType['any']): boolean => {
  return (
    type === 'json' ||
    type === 'json_string' ||
    type.startsWith('list.') ||
    type === 'rating' ||
    type === 'dimension' ||
    type === 'volume' ||
    type === 'weight' ||
    type === 'boolean'
  )
}

const moneySchema = z.object({
  amount: z.number(),
  currency_code: z
    .string()
    .length(
      3,
      'Currency codes must be in 3 characters (ISO 4217 format). EG: USD, CAD, EUR'
    ),
})
export type MetafieldSavableType<T = MetafieldType['any']> =
  T extends MetafieldType['any']
    ? {
        _unsupported?: boolean
        partialSupport?: boolean
        title: string
        type: T
        baseType: MetafieldType['single']
        defaultStringValue: string
        validate: (value: any) => null | string
        isList: boolean
        deprecated?: boolean
        jsonSchema?: any
        searchResultType?: SearchResultTypes
        example?: {
          single: {
            description: string
            value: string
          }
          list: {
            description: string
            value: string
          }
        }
      }
    : never

function validateSpecialJsonType(
  value: any,
  validUnits: string[],
  name: string,
  customValidator: (x: typeof value, y: any) => boolean = () => true
): string | null {
  type ObjType = { unit: string; value: number }
  let json: ObjType | null = null

  if (typeof value === 'string') {
    if (!isJsonString(value)) return 'Invalid JSON string'
    json = JSON.parse(value)
  }

  if (typeOf(value) === 'Object' || typeOf(json) === 'Object') {
    const obj: ObjType = json || value
    if (
      validUnits.some(unit => obj.unit === unit) &&
      isNumeric(obj.value) &&
      Object.keys(obj).length === 2 &&
      customValidator(value, json)
    ) {
      return null
      if (obj.value > 0) return null
      return `Value must be greater than 0`
    }
  }

  return `Invalid ${name} schema`
}

const MetafieldSavableTypeSingle: {
  [K in MetafieldType['single']]: MetafieldSavableType<K>
} = {
  _unsupported_: {
    title: '<Unsupported>',
    type: '_unsupported_',
    baseType: '_unsupported_',
    defaultStringValue: '',
    validate: (value: any) => null,
    _unsupported: true,
    deprecated: true,
    isList: false,
  },
  single_line_text_field: {
    title: 'Single line text',
    type: 'single_line_text_field',
    baseType: 'single_line_text_field',
    defaultStringValue: '',
    validate: (value: any) =>
      typeof value === 'string' && !value.includes('\n')
        ? value.trim().length === 0
          ? `Can't be blank`
          : null
        : 'Value must be a single line string',
    example: {
      single: {
        description: 'A single-line text value.',
        value: '<code>This item contains dairy products.</code>',
      },
      list: {
        description: 'List of single-line text values.',
        value: '<code>["flour", "butter", "sugar"]</code>',
      },
    },
    isList: false,
  },
  multi_line_text_field: {
    isList: false,
    title: 'Multi-line text',
    type: 'multi_line_text_field',
    baseType: 'multi_line_text_field',
    defaultStringValue: '',
    validate: (value: any) =>
      typeof value === 'string'
        ? value.trim().length === 0
          ? `Can't be blank`
          : null
        : 'Value must be a string',
    example: {
      single: {
        description: 'A multi-line text value.',
        value: `<pre>Ingredients:
- Flour
- Water
- Milk
- Eggs
</pre>`,
      },
      list: {
        description: 'List of multi-line text values.',
        value: `<pre><code>["Ingredients: \n- Flour \n- Water \n- Milk \n- Eggs", "Can make: \n- Cake \n- Pasta \n- Doughnut \n- Naan"]</code></pre>`,
      },
    },
  },
  page_reference: {
    isList: false,
    title: 'Page reference',
    type: 'page_reference',
    baseType: 'page_reference',
    searchResultType: SearchResultTypes.Enum.ONLINE_STORE_PAGE,
    //defaultStringValue: 'gid://shopify/OnlineStorePage/0',
    defaultStringValue: '',
    validate: (id: any) => {
      if (typeof id !== 'string') return 'Value must be a string'
      return id.startsWith('gid://shopify/OnlineStorePage/') &&
        /\d+$/.test(id) &&
        !id.endsWith('/0')
        ? null
        : 'Incorrect page reference format'
    },
    example: {
      single: {
        description: 'A reference to a page on the online store.',
        value: '<code>gid://shopify/OnlineStorePage/1</code>',
      },
      list: {
        description: 'A list of references to pages on the online store.',
        value:
          '<code>["gid://shopify/OnlineStorePage/1", "gid://shopify/OnlineStorePage/2"]</code>',
      },
    },
  },
  collection_reference: {
    isList: false,
    title: 'Collection reference',
    type: 'collection_reference',
    baseType: 'collection_reference',
    searchResultType: SearchResultTypes.Enum.COLLECTION,
    //defaultStringValue: 'gid://shopify/Collection/0',
    defaultStringValue: '',
    validate: (id: any) => {
      if (typeof id !== 'string') return 'Value must be a string'
      return id.startsWith('gid://shopify/Collection/') &&
        /\d+$/.test(id) &&
        !id.endsWith('/0')
        ? null
        : 'Incorrect collection  reference format'
    },
    example: {
      single: {
        description: 'A reference to a collection on the online store.',
        value: '<code>gid://shopify/Collection/1</code>',
      },
      list: {
        description: 'A list of references to collections on the online store.',
        value:
          '<code>["gid://shopify/Collection/1", "gid://shopify/Collection/2"]</code>',
      },
    },
  },
  product_reference: {
    isList: false,
    title: 'Product reference',
    type: 'product_reference',
    baseType: 'product_reference',
    searchResultType: SearchResultTypes.Enum.PRODUCT,
    //defaultStringValue: 'gid://shopify/Product/0',
    defaultStringValue: '',
    validate: (id: any) => {
      if (typeof id !== 'string') return 'Value must be a string'
      return id.startsWith('gid://shopify/Product/') &&
        /\d+$/.test(id) &&
        !id.endsWith('/0')
        ? null
        : 'Incorrect product reference format'
    },
    example: {
      single: {
        description: 'A reference to a product on the online store.',
        value: '<code>gid://shopify/Product/1</code>',
      },
      list: {
        description: 'A list of references to products on the online store.',
        value:
          '<code>["gid://shopify/Product/1", "gid://shopify/Product/2"]</code>',
      },
    },
  },
  variant_reference: {
    isList: false,
    title: 'Variant reference',
    type: 'variant_reference',
    baseType: 'variant_reference',
    searchResultType: SearchResultTypes.Enum.PRODUCT_VARIANT,
    //defaultStringValue: 'gid://shopify/ProductVariant/0',
    defaultStringValue: '',
    validate: (id: any) => {
      if (typeof id !== 'string') return 'Value must be a string'
      return id.startsWith('gid://shopify/ProductVariant/') &&
        /\d+$/.test(id) &&
        !id.endsWith('/0')
        ? null
        : 'Incorrect variant reference format'
    },
    example: {
      single: {
        description: 'A reference to a product variant on the online store.',
        value: '<code>gid://shopify/ProductVariant/1</code>',
      },
      list: {
        description:
          'A list of references to product variants on the online store.',
        value:
          '<code>["gid://shopify/ProductVariant/1", "gid://shopify/ProductVariant/2"]</code>',
      },
    },
  },
  file_reference: {
    partialSupport: false,
    isList: false,
    title: 'File reference',
    type: 'file_reference',
    baseType: 'file_reference',
    //defaultStringValue: 'gid://shopify/MediaImage/0',
    defaultStringValue: '',
    searchResultType: SearchResultTypes.Enum.FILE,
    validate: (id: any) => {
      if (typeof id !== 'string') return 'Value must be a string'
      return /^gid:\/\/shopify\/\w+\/\d+$/.test(id) && !id.endsWith('/0')
        ? null
        : 'Incorrect file reference format'
    },
    example: {
      single: {
        description:
          'A reference to a file on the online store, or a file that you upload when you create the metafield. The file size must be less than 20 MB.',
        value: '<code>gid://shopify/MediaImage/1</code>',
      },
      list: {
        description:
          'A list of references to a files on the online store, or a files that you upload when you create the metafield. The file size must be less than 20 MB.',
        value:
          '<code>["gid://shopify/MediaImage/1", "gid://shopify/GenericFile/2", "gid://shopify/Video/3"]</code>',
      },
    },
  },
  number_integer: {
    isList: false,
    title: 'Integer',
    type: 'number_integer',
    baseType: 'number_integer',
    defaultStringValue: '0',
    validate: (num: any) => {
      if (isInteger(num)) return null

      return 'Only integers allowed (no decimals)'
    },
    example: {
      single: {
        description: 'A whole number in the range of +/-9,007,199,254,740,991.',
        value: '<code>10</code>',
      },
      list: {
        description:
          'List of whole numbers in the range of +/-9,007,199,254,740,991.',
        value: '<code>[10, -20, 900]</code>',
      },
    },
  },
  number_decimal: {
    isList: false,
    title: 'Decimal',
    type: 'number_decimal',
    baseType: 'number_decimal',
    defaultStringValue: '0.0',
    validate: (num: any) => {
      const maybeDecimal = typeof num === 'string' ? /\d+\.\d+/.test(num) : null
      if (isNumeric(num) && maybeDecimal) return null
      return 'Only decimal numbers are allowed'
    },
    example: {
      single: {
        description:
          'A number with decimal places in the range of +/-9,999,999,999,999.999999999.',
        value: '<code>10.4</code>',
      },
      list: {
        description:
          'List of numbers with decimal places in the range of +/-9,999,999,999,999.999999999.',
        value: '<code>[10.4, -20.8, 900.25]</code>',
      },
    },
  },
  date: {
    isList: false,
    title: 'Date',
    type: 'date',
    baseType: 'date',
    defaultStringValue: 'YYYY-MM-DD',
    validate: (value: any) => {
      if (typeof value !== 'string') return 'Value must be a string'
      return isValidDateString(value) ? null : 'Invalid format'
    },
    example: {
      single: {
        description:
          'A date in <a target="_blank" href="https://www.iso.org/iso-8601-date-and-time-format.html">ISO 8601</a> format without a presumed timezone. (YYYY-MM-DD)',
        value: '<code>2021-02-02</code>',
      },
      list: {
        description:
          'List of dates in <a target="_blank" href="https://www.iso.org/iso-8601-date-and-time-format.html">ISO 8601</a> format without a presumed timezone. (YYYY-MM-DD)',
        value: '<code>["2021-02-02", "2022-06-15"]</code>',
      },
    },
  },
  date_time: {
    isList: false,
    title: 'Date and time',
    type: 'date_time',
    baseType: 'date_time',
    defaultStringValue: 'YYYY-MM-DDT0:00:00',
    validate: (value: any) => {
      if (typeof value !== 'string') return 'Value must be a string'
      return isValidDateString(value) &&
        /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\+\d\d:\d\d)?$/.test(
          value
        )
        ? null
        : 'Invalid format'
    },
    example: {
      single: {
        description:
          'A datetime in <a target="_blank" href="https://www.iso.org/iso-8601-date-and-time-format.html">ISO 8601</a> format without a presumed timezone. (YYYY-MM-DD)',
        value: '<code>2021-02-02T12:30:00</code>',
      },
      list: {
        description:
          'List of datetimes in <a target="_blank" href="https://www.iso.org/iso-8601-date-and-time-format.html">ISO 8601</a> format without a presumed timezone. (YYYY-MM-DDT12:30:00)',
        value: '<code>["2021-02-02T12:30:00", "2022-06-15T01:00:00"]</code>',
      },
    },
  },
  url: {
    isList: false,
    title: 'URL',
    type: 'url',
    baseType: 'url',
    defaultStringValue: 'https://',
    validate: (value: any) => {
      if (typeof value !== 'string') return 'Value must be a string'

      return ['https', 'http', 'mailto', 'sms', 'tel'].some(x => {
        const proto = `${x}://`
        return value.startsWith(proto) && value.trim().length > proto.length
      })
        ? null
        : 'Invalid protocol'
    },
    example: {
      single: {
        description:
          'A URL with one of the allowed schemes: <code>https</code>, <code>http</code>, <code>mailto</code>, <code>sms</code>, <code>tel</code>',
        value: '<code>https://www.shopify.com</code>',
      },
      list: {
        description:
          'List of URLs with one of the allowed schemes: <code>https</code>, <code>http</code>, <code>mailto</code>, <code>sms</code>, <code>tel</code>',
        value:
          '<code>["https://www.shopify.com", "https://www.google.com"]</code>',
      },
    },
  },
  json: {
    isList: false,
    title: 'JSON string',
    type: 'json',
    baseType: 'json',
    defaultStringValue: '{}',
    validate: (value: any) => {
      if (typeof value === 'string') {
        return isJsonString(value) ? null : 'Invalid JSON string'
      }
      return isJsonable(value) ? null : 'Invalid JSON (not object or array)'
    },
    example: {
      single: {
        description:
          'Any valid JSONable string. (Array, Object, null, booleans, etc)',
        value:
          '<code>[{ "key": "value" }, { "key": "value" }]</code> <br> Or <br> <code>{ "key1": "value1", "key2": "value" }</code>',
      },
      list: {
        description:
          'List of JSON-formatted strings.<br><b>Note:</b> The <code>json_string</code> type is deprecated but does still exist because it behaves differently than the new <code>json</code> type in Liquid.',
        value: '<code>[ { "k": "v1" },  [{ "k": "v1" }}] ]</code>',
      },
    },
  },
  boolean: {
    isList: false,
    title: 'Boolean',
    type: 'boolean',
    baseType: 'boolean',
    defaultStringValue: 'false',
    validate: (value: any) => {
      const t = typeof value
      const err = 'Must be boolean (true / false)'
      if (t === 'boolean') return null
      if (t !== 'string') return err

      if (value === 'true' || value === 'false') return null
      return err
    },
    example: {
      single: {
        description: 'A <code>true</code> or <code>false</code> value.',
        value: '<code>true</code>',
      },
      list: {
        description: 'List of <code>true</code> or <code>false</code> values.',
        value: '<code>[true, false]</code>',
      },
    },
  },
  color: {
    isList: false,
    title: 'Color',
    type: 'color',
    baseType: 'color',
    defaultStringValue: '#000000',
    validate: (value: any) => {
      if (typeof value !== 'string') return 'Value must be a string'
      return /^#(?:[0-9a-f]{6})$/i.test(value)
        ? null
        : 'Must be valid hexadecimal value'
    },
    example: {
      single: {
        description: 'A hexadecimal color code.',
        value: '<code>#8d2f25</code>',
      },
      list: {
        description: 'List of hexadecimal color codes.',
        value: '<code>["#fff123", "#8d2f25"]</code>',
      },
    },
  },
  money: {
    isList: false,
    title: 'Money',
    type: 'money',
    baseType: 'money',
    defaultStringValue: '{ "amount": 5.99, "currency_code": "USD" }',
    validate: (value: any) => {
      const obj =
        typeof value === 'string' ? safeJsonParse(value, value) : value
      if (typeOf(obj) === 'Object') {
        const result = moneySchema.safeParse(obj)
        return result.success ? null : result.error.message
      }

      return 'Invalid money format. Must be in JSON'
    },
    example: {
      single: {
        description:
          'Amount and Currency Code (in <a hef="https://en.wikipedia.org/wiki/ISO_4217#List_of_ISO_4217_currency_codes" target="_blank">ISO 4217 format</a>)',
        value: '<code>{ "amount": 5.99, "currency_code": "USD" }</code>',
      },
      list: {
        description:
          'A list of Amounts and Currency Codes (in <a hef="https://en.wikipedia.org/wiki/ISO_4217#List_of_ISO_4217_currency_codes" target="_blank">ISO 4217 format</a>)',
        value:
          '<code>[{ "amount": 5.99, "currency_code": "USD" }, { "amount": 24.99, "currency_code": "EUR" }]</code>',
      },
    },
    jsonSchema: {
      properties: {
        unit: {
          enum: ['oz', 'lb', 'g', 'kg'],
        },
        value: {
          type: ['number', 'string'],
          pattern: '^(-|\\+)?\\d+(\\.\\d+)?$',
          minimum: 0,
        },
      },
      required: ['unit', 'value'],
    },
  },
  weight: {
    isList: false,
    title: 'Weight',
    type: 'weight',
    baseType: 'weight',
    defaultStringValue: '{ "unit": "kg", "value": 2.5 }',
    validate: (value: any) =>
      validateSpecialJsonType(value, ['oz', 'lb', 'g', 'kg'], 'weight'),
    example: {
      single: {
        description:
          'A value and a unit of weight. Valid unit values: <code>oz</code>, <code>lb</code>, <code>g</code>, <code>kg</code>',
        value: '<code>{ "unit": "kg", "value": 2.5 }</code>',
      },
      list: {
        description:
          'A list of values and a units of weight. Valid unit values: <code>oz</code>, <code>lb</code>, <code>g</code>, <code>kg</code>',
        value:
          '<code>[{ "unit": "kg", "value": 2.5 }, { "unit": "kg", "value": 5.5 }]</code>',
      },
    },
    jsonSchema: {
      properties: {
        unit: {
          enum: ['oz', 'lb', 'g', 'kg'],
        },
        value: {
          type: ['number', 'string'],
          pattern: '^(-|\\+)?\\d+(\\.\\d+)?$',
          minimum: 0,
        },
      },
      required: ['unit', 'value'],
    },
  },
  volume: {
    isList: false,
    title: 'Volume',
    type: 'volume',
    baseType: 'volume',
    defaultStringValue: '{ "unit": "ml", "value": 20.0 }',
    validate: (value: any) =>
      validateSpecialJsonType(
        value,
        [
          'ml',
          'cl',
          'l',
          'm3',
          'us_fl_oz',
          'us_pt',
          'us_qt',
          'us_gal',
          'imp_fl_oz',
          'imp_pt',
          'imp_qt',
          'imp_gal',
        ],
        'volume'
      ),
    example: {
      single: {
        description:
          'A value and a unit of volume. Valid unit values: <code>ml</code>, <code>cl</code>, <code>l</code>, <code>m3</code> (cubic meters), <code>us_fl_oz</code>, <code>us_pt</code>, <code>us_qt</code>, <code>us_gal</code>, <code>imp_fl_oz</code>, <code>imp_pt</code>, <code>imp_qt</code>, <code>imp_gal</code>.',
        value: '<code>{ "unit": "ml", "value": 20.0 }</code>',
      },
      list: {
        description:
          'A list of values and a units of volume. Valid unit values: <code>ml</code>, <code>cl</code>, <code>l</code>, <code>m3</code> (cubic meters), <code>us_fl_oz</code>, <code>us_pt</code>, <code>us_qt</code>, <code>us_gal</code>, <code>imp_fl_oz</code>, <code>imp_pt</code>, <code>imp_qt</code>, <code>imp_gal</code>.',
        value:
          '<code>[{ "unit": "ml", "value": 20.0 }, { "unit": "ml", "value": 45.5 }]</code>',
      },
    },
    jsonSchema: {
      properties: {
        unit: {
          enum: [
            'ml',
            'cl',
            'l',
            'm3',
            'us_fl_oz',
            'us_pt',
            'us_qt',
            'us_gal',
            'imp_fl_oz',
            'imp_pt',
            'imp_qt',
            'imp_gal',
          ],
        },
        value: {
          type: ['number', 'string'],
          pattern: '^(-|\\+)?\\d+(\\.\\d+)?$',
          minimum: 0,
        },
      },
      required: ['unit', 'value'],
    },
  },
  dimension: {
    isList: false,
    title: 'Dimension',
    type: 'dimension',
    baseType: 'dimension',
    defaultStringValue: '{ "unit": "cm", "value": 25.0 }',
    validate: (value: any) =>
      validateSpecialJsonType(
        value,
        ['in', 'ft', 'yd', 'mm', 'cm', 'm'],
        'dimension'
      ),
    example: {
      single: {
        description:
          'A value and a unit of length. Valid unit values: <code>in</code>, <code>ft</code>, <code>yd</code>, <code>mm</code>, <code>cm</code>, <code>m</code>',
        value: '<code>{ "unit": "cm", "value": 25.0 }</code>',
      },
      list: {
        description:
          'A list of values and a units of length. Valid unit values: <code>in</code>, <code>ft</code>, <code>yd</code>, <code>mm</code>, <code>cm</code>, <code>m</code>',
        value:
          '<code>[{ "unit": "cm", "value": 25.0 }, { "unit": "cm", "value": 150.5 }]</code>',
      },
    },
    jsonSchema: {
      properties: {
        unit: {
          enum: ['mm', 'cm', 'in', 'ft', 'm', 'yd'],
        },
        value: {
          type: ['number', 'string'],
          pattern: '^(-|\\+)?\\d+(\\.\\d+)?$',
          minimum: 0,
        },
      },
      required: ['unit', 'value'],
    },
  },
  rating: {
    isList: false,
    title: 'Rating',
    type: 'rating',
    baseType: 'rating',
    defaultStringValue: JSON.stringify(
      {
        scale_min: '1.0',
        scale_max: '5.0',
        value: '3.5',
      },
      null,
      2
    ),
    validate: (value: any) => {
      const parsed = safeJsonParse(value, value)

      if (typeOf(parsed) === 'Object') {
        const { scale_min, scale_max, value: _val } = parsed
        if (isNumeric(scale_min) && isNumeric(scale_max) && isNumeric(_val))
          return null
      }
      return 'Invalid rating schema'
    },
    example: {
      single: {
        description: 'A rating measured on a specified decimal scale.',
        value:
          '<code>{ "scale_min": "1.0", "scale_max": "5.0", "value": "3.5" }</code>',
      },
      list: {
        description: 'List of ratings measured on a specified decimal scale.',
        value:
          '<code>[{ "scale_min": "1.0", "scale_max": "5.0", "value": "3.5" }, { "scale_min": "1.0", "scale_max": "5.0", "value": "4.5" }]</code>',
      },
    },
    jsonSchema: {
      properties: {
        scale_min: {
          type: ['number', 'string'],
          pattern: '^(-|\\+)?\\d+(\\.\\d+)?$',
        },
        scale_max: {
          type: ['number', 'string'],
          pattern: '^(-|\\+)?\\d+(\\.\\d+)?$',
        },
        value: {
          type: ['number', 'string'],
          pattern: '^(-|\\+)?\\d+(\\.\\d+)?$',
        },
      },
      required: ['scale_min', 'scale_max', 'value'],
    },
  },
  metaobject_reference: {
    partialSupport: true,
    isList: false,
    title: 'Metaobject reference',
    type: 'metaobject_reference',
    baseType: 'metaobject_reference',
    //defaultStringValue: 'gid://shopify/Metaobject/0',
    defaultStringValue: '',
    validate: (id: any) => {
      return null
      return typeof id === 'string' &&
        id.startsWith('gid://shopify/Metaobject/') &&
        /\d+$/.test(id) &&
        !id.endsWith('/0')
        ? null
        : 'Incorrect metaobject reference format'
    },
    example: {
      single: {
        description:
          'A reference to a <a href="https://help.shopify.com/en/manual/custom-data/metaobjects/referencing-metaobjects" target="_blank">metaobject entry.</a>',
        value: '<code>gid://shopify/Metaobject/123</code>',
      },
      list: {
        description:
          'A list reference to one or more metaobject entries that belong to a single metaobject definition. Unlike list.mixed_reference, all metaobject entries referenced must be of the same definition.',
        value:
          '<code>["gid://shopify/Metaobject/1", "gid://shopify/Metaobject/2"]</code>',
      },
    },
  },
  mixed_reference: {
    partialSupport: true,
    isList: false,
    title: 'Mixed (metaobject) reference',
    type: 'mixed_reference',
    baseType: 'mixed_reference',
    //defaultStringValue: 'gid://shopify/Metaobject/0',
    defaultStringValue: '',
    validate: (id: any) => {
      return null
      return typeof id === 'string' &&
        id.startsWith('gid://shopify/Metaobject/') &&
        /\d+$/.test(id) &&
        !id.endsWith('/0')
        ? null
        : 'Incorrect mixed metaobject reference format'
    },
    example: {
      single: {
        description:
          'A reference to one of many <a href="https://help.shopify.com/en/manual/custom-data/metaobjects/referencing-metaobjects" target="_blank">metaobject</a> definitions. Unlike <code>metaobject_reference</code> which only allows for a single metaobject definition to be set, mixed references allow for metaobjects that belong to different definitions.',
        value: '<code>gid://shopify/Metaobject/123</code>',
      },
      list: {
        description:
          'A list reference to one or more metaobject entries that may belong to different metaobject definitions.',
        value:
          '<code>["gid://shopify/Metaobject/123", "gid://shopify/Metaobject/456"]</code>',
      },
    },
  },
  string: {
    // @deprecated
    isList: false,
    title: 'String (deprecated)',
    type: 'string',
    baseType: 'string',
    defaultStringValue: '',
    deprecated: true,
    validate: (value: any) =>
      typeof value === 'string'
        ? value.length === 0
          ? `Can't be blank`
          : null
        : 'Value must be a single line string',
    example: {
      single: {
        description: '[DEPRICATED] - Any string value',
        value: '<code>Some text</code>',
      },
      list: {
        description: '[DEPRICATED] - List of any string values',
        value: '<code>["Fluffy kitty", "Lovely kitty"]</code>',
      },
    },
  },
  json_string: {
    // @deprecated type
    isList: false,
    title: 'JSON String (deprecated)',
    type: 'json_string',
    baseType: 'json_string',
    defaultStringValue: '{}',
    deprecated: true,
    validate: (value: any) => {
      if (typeof value === 'string') {
        return isJsonString(value) ? null : 'Invalid JSON string'
      }
      return isJsonable(value) ? null : 'Invalid JSON'
    },
    example: {
      single: {
        description:
          '[DEPRICATED] - Any valid JSONable string. (Array, Object, null, booleans, etc)',
        value:
          '<code>[{ "key": "value" }, { "key": "value" }]</code> <br> Or <br> <code>{ "key1": "value1", "key2": "value" }</code>',
      },
      // list is never allowed..
      list: {
        description:
          '[DEPRICATED] - A list valid JSONable string. (Array, Object, null, booleans, etc)',
        value: '<code>[ { "key": "v1" },  [{ "key": "v1" }}] ]</code>',
      },
    },
  },
  integer: {
    // @deprecated t
    isList: false,
    title: 'Integer (deprecated)',
    type: 'integer',
    baseType: 'integer',
    defaultStringValue: '0',
    deprecated: true,
    validate: (value: any) => {
      if (isInteger(value)) return null

      return 'Only integers allowed (no decimals)'
    },
    example: {
      single: {
        description: '[DEPRICATED] - Any valid integer (no decimals)',
        value: '<code>10</code>',
      },
      list: {
        description: '[DEPRICATED] - List of any valid integer (no decimals)',
        value: '<code>[10, -20, 900]</code>',
      },
    },
  },
} as const

const MetafieldSavableTypeList = MetafieldType['single'].options.reduce(
  (acc, key) => {
    const maybeListableResult = MetafieldType['list'].safeParse(`list.${key}`)

    if (!maybeListableResult.success) {
      return acc
    }

    const listableKey = maybeListableResult.data

    const baseType = { ...MetafieldSavableTypeSingle[key] }
    if (!baseType.baseType) return acc

    const isJsonBaseType = isMetafieldTypeJson(baseType.type)
    const schema = baseType.jsonSchema
      ? {
          type: 'array',
          items: {
            type: 'object',
            ...baseType.jsonSchema,
          },
        }
      : undefined

    const nextValue = {
      title: `${baseType.title} (list)`,
      type: listableKey,
      baseType: key,
      jsonSchema: schema,
      defaultStringValue:
        key.endsWith('_reference') || baseType.defaultStringValue === ''
          ? JsonStringify([], 2)
          : isJsonBaseType
          ? JsonStringify(
              [
                safeJsonParse(
                  baseType.defaultStringValue,
                  baseType.defaultStringValue,
                  false
                ),
              ],
              2
            )
          : JsonStringify([baseType.defaultStringValue], 2),
      example: baseType.example,
      validate: (value: any) => {
        let arr: any[] | null = value

        if (typeof value === 'string' && isJsonString(value)) {
          arr = JSON.parse(value)
        }

        if (Array.isArray(arr)) {
          let err: string | null = null
          return arr.every(value => {
            err = baseType.validate(value)
            return err === null
          })
            ? null
            : err
        }

        return 'Only list of values are accepted.'
      },
      isList: true,
      _unsupported: baseType._unsupported ?? false,
      partialSupport: baseType.partialSupport ?? false,
    }

    acc[listableKey] = nextValue

    return acc
  },
  {} as any
) as { [K in MetafieldType['list']]: MetafieldSavableType<K> }

export const MetafieldSavableType: {
  [K in MetafieldType['any']]: MetafieldSavableType<K>
} = {
  ...MetafieldSavableTypeSingle,
  ...MetafieldSavableTypeList,
} as const

export const MetafieldSavableTypes = R.pipe(
  R.reduce(
    Object.keys(MetafieldSavableType) as Array<MetafieldType['any']>,
    (acc, current) => {
      const savableType = MetafieldSavableType[current]
      if (!savableType._unsupported) {
        acc.push(savableType)
      }
      return acc
    },
    [] as MetafieldSavableType[]
  ),

  R.sort((a, b) => {
    if (a._unsupported && b._unsupported) return 0
    if (a._unsupported) return 1
    if (b._unsupported) return -1

    const aDep = a.title.includes('deprecated')
    const bDep = b.title.includes('deprecated')

    if (aDep && bDep) return 0
    if (aDep) return 1
    if (bDep) return -1

    return a.title.localeCompare(b.title)
  })
)

export const getMonacoSchema = (metafieldType: MetafieldType['any']) => {
  const savableType = MetafieldSavableType[metafieldType]
  if (!savableType || !savableType.jsonSchema) return null
  return savableType.jsonSchema
}
