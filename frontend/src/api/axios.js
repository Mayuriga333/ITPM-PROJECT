/**
 * api/axios.js — P2 compatibility layer
 * P2 pages import: import API from "../../api/axios"
 * This re-exports the unified api instance, which handles auth tokens correctly.
 */

import api from '../services/api';
export default api;
