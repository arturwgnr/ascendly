import axios from 'axios';

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshing) {
        refreshing = axios
          .post('/api/auth/refresh', {}, { withCredentials: true })
          .then((r) => {
            accessToken = r.data.accessToken;
            refreshing = null;
          })
          .catch(() => {
            refreshing = null;
            accessToken = null;
            window.dispatchEvent(new Event('auth:logout'));
          });
      }
      await refreshing;
      if (accessToken) {
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
