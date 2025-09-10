// src/services/petsApiService.ts
import axios from 'axios';
import { API_BASE_URL } from '@/constants/apiRoutes';

export type PetCategory = {
  _id: string;
  name: string;
  description?: string;
  iconKey?: string;
};

export type CreatePetBody = {
  name: string;
  speciesCategoryId: string;
  sex?: 'male' | 'female' | 'unknown';
  birthDate?: string;  // ISO date string
  notes?: string;
  photoUrl?: string;
};

// Create an axios client consistent with your other services
const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
});

// Attach Authorization from localStorage token like your other clients
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 refresh handling (same pattern as doctor/admin)
let isRefreshing = false;
let queue: Array<() => void> = [];

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => queue.push(resolve));
      }

      try {
        isRefreshing = true;
        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newAccess = refreshRes?.data?.accessToken;
        if (newAccess) {
          localStorage.setItem('auth_token', newAccess);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newAccess}`;
          queue.forEach((fn) => fn());
          queue = [];
          return client.request(original);
        }
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Categories
export async function getActiveCategories(): Promise<PetCategory[]> {
  const { data } = await client.get('/pet-categories', {
    params: { active: true },
  });
  // backend may return { data } envelope or raw array
  return (data?.data ?? data) as PetCategory[];
}

// Pets
export async function listMyPets(page = 1, limit = 6) {
  const { data } = await client.get('/pets', {
    params: { owner: 'me', page, limit },
  });
  // expected: { data, total, page, totalPages }
  return data;
}

export async function createPet(body: CreatePetBody) {
  const { data } = await client.post('/pets', body, {
    headers: { 'Content-Type': 'application/json' },
  });
  // returns created pet object
  return data;
}

export async function uploadPetPhoto(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await client.post('/pet-uploads/photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  // backend returns { url }
  return data as { url: string };
}

export async function presignPetPhoto(contentType: string, ext?: string) {
  const { data } = await client.post(
    '/uploads/pets/photo/presign',
    { contentType, ext },
    { headers: { 'Content-Type': 'application/json' } }
  );
  // returns { uploadUrl, publicUrl, key, expiresIn }
  return data;
}

export async function updatePet(id: string, patch: Partial<CreatePetBody>) {
  const { data } = await client.patch(`/pets/${id}`, patch, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data; // updated pet
}

export async function deletePet(id: string) {
  const { data, status } = await client.delete(`/pets/${id}`);
  // Some APIs return 204 with empty body; normalize to success boolean
  return status === 204 ? { success: true } : (data ?? { success: true });
}