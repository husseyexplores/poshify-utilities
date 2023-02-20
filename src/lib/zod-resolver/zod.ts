import { appendErrors, FieldError, FieldErrors } from 'react-hook-form'
import { z } from 'zod'
import { toNestError, validateFieldsNatively } from '@hookform/resolvers'
import type { Resolver } from './zod-resolver-types'

const parseErrorSchema = (
  zodErrors: z.ZodIssue[],
  validateAllFieldCriteria: boolean
) => {
  const errors: Record<string, FieldError> = {}
  for (; zodErrors.length; ) {
    const error = zodErrors[0]
    const { code, message, path, ...rest } = error
    const _path = path.join('.')
    const params = error.code === 'custom' ? error.params : null

    if (!errors[_path]) {
      if ('unionErrors' in error) {
        const unionError = error.unionErrors[0].errors[0]

        errors[_path] = {
          message: unionError.message,
          type: unionError.code,
          // we also need `params`
          // @ts-expect-error
          params,
        }
      } else {
        errors[_path] = {
          message,
          type: code,
          // @ts-expect-error
          params,
        }
      }
    }

    if ('unionErrors' in error) {
      error.unionErrors.forEach(unionError =>
        unionError.errors.forEach(e => zodErrors.push(e))
      )
    }

    if (validateAllFieldCriteria) {
      const types = errors[_path].types
      const messages = types && types[error.code]

      errors[_path] = appendErrors(
        _path,
        validateAllFieldCriteria,
        errors,
        code,
        // @ts-expect-error
        messages
          ? ([] as string[]).concat(
              messages as unknown as string[],
              error.message
            )
          : error.message
      ) as FieldError
    }

    zodErrors.shift()
  }

  return errors
}

export const zodResolver: Resolver =
  (schema, schemaOptions, resolverOptions = {}) =>
  async (values, _, options) => {
    try {
      const data = await schema[
        resolverOptions.mode === 'sync' ? 'parse' : 'parseAsync'
      ](values, schemaOptions)

      options.shouldUseNativeValidation && validateFieldsNatively({}, options)

      return {
        errors: {} as FieldErrors,
        values: resolverOptions.rawValues ? values : data,
      }
    } catch (error: any) {
      return {
        values: {},
        errors: error.isEmpty
          ? {}
          : toNestError(
              parseErrorSchema(
                error.errors,
                !options.shouldUseNativeValidation &&
                  options.criteriaMode === 'all'
              ),
              options
            ),
      }
    }
  }
