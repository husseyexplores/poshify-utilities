import { parse as zipsonParse, stringify as zipsonStringify } from 'zipson'
function decodeFromBinary(str: string): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(window.atob(str), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      })
      .join('')
  )
}
function encodeToBinary(str: string): string {
  return window.btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(parseInt(p1, 16))
    })
  )
}

export const searchParser = {
  parse: (value: string) =>
    zipsonParse(decodeURIComponent(decodeFromBinary(value))),
  serialize: (value: any) =>
    encodeToBinary(encodeURIComponent(zipsonStringify(value))),
}
