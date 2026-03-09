import axios from 'axios';

// The Next.js API URL
// On the server, we hit the internal docker network. On the client, we hit /api/ via nginx proxy.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Required to send/receive cookies (like refresh tokens)
    withCredentials: true,
});

// Request interceptor to attach access token if it exists
api.interceptors.request.use(
    (config) => {
        // We will store the access token in localStorage for client-side use
        // or handle it differently inside Server Components.
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('access_token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle transparent token refreshing
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 Unauthorized, and this is NOT a retry, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Call the token refresh endpoint (HttpOnly cookie will be sent automatically)
                const response = await axios.post(
                    `${API_URL}/v1/auth/sessions/refresh/`,
                    {},
                    { withCredentials: true }
                );

                const { access } = response.data.data;

                if (typeof window !== 'undefined') {
                    localStorage.setItem('access_token', access);
                }

                // Update the Authorization header and retry the request
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails (e.g., refresh token is expired or blacklisted), wipe out state
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('access_token');
                    // Optional: Redirect to login page or emit a global logout event
                    // window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
