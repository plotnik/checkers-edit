/*
 * Runtime configuration is kept in one small module so components can import a
 * named setting instead of reading Vite environment variables directly.
 */
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
};

export default config;
