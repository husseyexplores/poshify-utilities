import { forEach, BASE_URL } from '../../../utils'

export function makeCsvComptJson(productJson, reqFields) {
  // converts products variants into csv parseable json
  const normailizedArray = []
  const { variants } = productJson
  let hasVariants = false

  // Loop through reqFields and extract product-level req fields
  const productReqFields = {}
  forEach(reqFields, (shouldInclude, key) => {
    if (shouldInclude && key.includes('product.')) {
      const cleanKey = key.split('.')[1]
      productReqFields[key] = productJson[cleanKey]
    }

    if (!hasVariants && key.includes('variant')) {
      hasVariants = true
    }
  })

  if (hasVariants) {
    variants.forEach(variantJson => {
      // Iterate over variant object and extract req fields like above
      const variantReqFields = {}
      forEach(reqFields, (shouldInclude, key) => {
        if (shouldInclude && key.includes('variant.')) {
          const cleanKey = key.split('.')[1]
          variantReqFields[key] = variantJson[cleanKey]
        }
      })

      // Construct row
      const row = { ...productReqFields, ...variantReqFields } // Each row has parent product data
      normailizedArray.push(row)
    })
  } else {
    normailizedArray.push(productReqFields)
  }
  return normailizedArray
}

export function fetchProductsDataForCsv(productIds) {
  return new Promise((resolve, reject) => {
    const MAX_LIMIT = 250
    let currPage = 1
    const fetchedProducts = []
    const baseEndpointURL = `${BASE_URL}/products.json`

    function recursiveLookup() {
      if (productIds.length === 0) {
        // Base case!
        return resolve(fetchedProducts)
      }

      const qs = `?limit=${MAX_LIMIT}&page=${currPage}fields=id,title,body_html,vendor,product_type,handle,created_at,updated_at,published_at,template_suffix,tags,published_scope,id,product_id,title,price,sku,position,inventory_policy,compare_at_price,fulfillment_service,inventory_management,option1,option2,option3,created_at,updated_at,taxable,barcode,grams,image_id,weight,weight_unit,inventory_item_id,inventory_quantity,old_inventory_quantity,requires_shipping&ids=${productIds.join(
        ','
      )}`

      const url = baseEndpointURL + qs
      console.log(
        'Fetching products for CSV.',
        `Current page: ${currPage}`,
        url
      )

      fetch(url, { headers: { 'content-type': 'application/json' } })
        .then(res => res.json())
        .then(res => {
          const { products = [] } = res

          products.forEach(product => {
            fetchedProducts.push(product)
          })

          // base case
          if (products.length < MAX_LIMIT) {
            return resolve(fetchedProducts)
          }

          // recurse
          currPage++
          setTimeout(() => {
            recursiveLookup()
          }, 1500) // 1 sec delay as a safer option
        })
        .catch(e => {
          return reject(e)
        })
    }

    // Start fetching!
    recursiveLookup()
  })
}

export function jsonToCsv(jsonArray) {
  const replacer = (key, value) => (value === null ? '' : value.toString())
  const header = Object.keys(jsonArray[0])
  const csv = jsonArray.map(row =>
    header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(',')
  )
  csv.unshift(header.join(','))
  return csv.join('\r\n')
}

export function downloadCSV(csv) {
  var csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  var csvURL = null
  const filename = getCsvFilename()
  if (navigator.msSaveBlob) {
    csvURL = navigator.msSaveBlob(csvData, filename)
  } else {
    csvURL = window.URL.createObjectURL(csvData)
  }

  const tempLink = document.createElement('a')
  tempLink.href = csvURL
  tempLink.setAttribute('download', filename)
  document.body.appendChild(tempLink)
  return tempLink
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const zerofy = int => ('0' + int).slice(-2)
export function getCsvFilename() {
  const [storename] = window.location.hostname.split('.')

  const now = new Date()
  let day = now.getDate()
  const monthName = monthNames[now.getMonth()]
  const year = now.getFullYear()

  let [hours, min, sec] = [now.getHours(), now.getMinutes(), now.getSeconds()]
  const ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  hours = hours === 0 ? 12 : hours // the hour '0' should be '12'

  sec = zerofy(sec)
  min = zerofy(min)
  day = zerofy(day)
  hours = zerofy(hours)
  return `csv_export__${storename}__${monthName}-${day}-${year}__${hours}hr-${min}min-${sec}sec-${ampm}.csv`
}
