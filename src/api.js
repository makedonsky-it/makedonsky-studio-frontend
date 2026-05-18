export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status ?? 0
    this.code = options.code ?? 'UNKNOWN_ERROR'
    this.details = options.details ?? null
    this.payload = options.payload ?? null
    this.isNetworkError = options.isNetworkError ?? false
  }
}

const parseJsonSafely = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const normalizeEnvelope = (payload) => {
  if (
    payload &&
    typeof payload === 'object' &&
    ('data' in payload || 'meta' in payload || 'error' in payload)
  ) {
    return {
      data: payload.data ?? null,
      meta: payload.meta ?? {},
      error: payload.error ?? null,
      payload,
    }
  }

  return {
    data: payload,
    meta: {},
    error: null,
    payload,
  }
}

export const apiRequest = async ({
  baseUrl,
  path,
  method = 'GET',
  body,
  token,
  headers = {},
  useAuth = true,
  isFormData = false,
  retry = true,
  refreshAccessToken,
}) => {
  const requestHeaders = new Headers(headers)

  if (!isFormData) {
    requestHeaders.set('Accept', 'application/json')
  }

  if (body && !isFormData) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (useAuth && token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: body
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined,
      credentials: 'include',
    })

    if (response.status === 401 && retry && refreshAccessToken && path !== '/auth/refresh') {
      const refreshedToken = await refreshAccessToken()

      if (refreshedToken) {
        return apiRequest({
          baseUrl,
          path,
          method,
          body,
          token: refreshedToken,
          headers,
          useAuth,
          isFormData,
          retry: false,
          refreshAccessToken,
        })
      }
    }

    const payload = await parseJsonSafely(response)

    if (!response.ok) {
      throw new ApiError(payload?.error?.message ?? response.statusText, {
        status: response.status,
        code: payload?.error?.code ?? `HTTP_${response.status}`,
        details: payload?.error?.details ?? null,
        payload,
      })
    }

    return normalizeEnvelope(payload)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    throw new ApiError('Не удалось связаться с сервером.', {
      code: 'NETWORK_ERROR',
      isNetworkError: true,
    })
  }
}
