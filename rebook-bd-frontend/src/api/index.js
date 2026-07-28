import client from './client';

// ── Auth ─────────────────────────────────────────────────────────────────────
export const register = (data)  => client.post('/auth/register', data);
export const login    = (data)  => client.post('/auth/login', data);
export const getMe    = ()      => client.get('/auth/me');

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories = () => client.get('/categories');

// ── Listings ─────────────────────────────────────────────────────────────────
export const getListings    = (params) => client.get('/listings', { params });
export const getListing     = (id)     => client.get(`/listings/${id}`);
export const createListing  = (data)   => client.post('/listings', data);
export const markSold       = (id, data) => client.patch(`/listings/${id}/sold`, data);

// ── Ratings ───────────────────────────────────────────────────────────────────
export const submitRating   = (data)   => client.post('/ratings', data);
export const getUserRatings = (userId) => client.get(`/ratings/user/${userId}`);
