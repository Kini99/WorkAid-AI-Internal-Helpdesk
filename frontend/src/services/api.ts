const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function fetchApi(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Something went wrong');
  }

  return response;
}

export async function get<T>(endpoint: string): Promise<T> {
  const response = await fetchApi(endpoint, { method: 'GET' });
  return response.json();
}

export async function post<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetchApi(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function put<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetchApi(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function del<T>(endpoint: string): Promise<T> {
  const response = await fetchApi(endpoint, { method: 'DELETE' });
  return response.json();
}
