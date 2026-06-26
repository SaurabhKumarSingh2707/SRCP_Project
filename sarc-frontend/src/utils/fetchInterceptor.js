export const setupFetchInterceptor = () => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
        // Automatically include credentials (cookies) in every fetch
        if (!init.credentials) {
            init.credentials = 'include';
        }
        
        let url = '';
        if (typeof input === 'string') url = input;
        else if (input && input.url) url = input.url;
        
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const isApiRequest = (apiUrl && url.includes(apiUrl)) || url.startsWith('/');
        
        if (isApiRequest) {
            const token = localStorage.getItem('sarc_token');
            if (token) {
                init.headers = {
                    ...init.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
        }
        
        let response = await originalFetch(input, init);
        
        // If unauthorized, try to refresh token
        if (response.status === 401 && !input.toString().includes('/api/auth/refresh-token') && !input.toString().includes('/api/auth/login')) {
            try {
                const baseURL = import.meta.env.VITE_API_URL || '';
                const refreshRes = await originalFetch(`${baseURL}/api/auth/refresh-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                
                if (refreshRes.ok) {
                    // The backend automatically set the new cookies.
                    // Retry original request.
                    let newInit = { ...init };
                    
                    if (input instanceof Request) {
                        const newRequest = new Request(input, newInit);
                        response = await originalFetch(newRequest);
                    } else {
                        response = await originalFetch(input, newInit);
                    }
                } else if (refreshRes.status === 401 || refreshRes.status === 403) {
                    // Refresh failed due to invalid token, clear role and redirect
                    localStorage.removeItem('sarc_role');
                    window.location.href = '/login';
                }
            } catch (e) {
                console.error("Token refresh failed", e);
            }
        }
        return response;
    };
};
