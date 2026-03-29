// Environment-specific configuration
// Values are loaded from .env.development or .env.production based on build mode

const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
};

export default config;
