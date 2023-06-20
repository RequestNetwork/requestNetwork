export const axios = async <T = unknown>(endpoint: string, { body, ...customConfig }: RequestInit = {}): Promise<{ data: T, status: number }> => {
  const headers = { 'content-type': 'application/json' }
  const config: RequestInit = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  }
  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${process.env.REACT_APP_API_URL}/${endpoint}`, config)
  if (response.ok) {
    return {
      status: response.status,
      data: await response.json()
    }
  } else {
    const errorMessage = await response.text()
    return Promise.reject(new Error(errorMessage))
  }
}
