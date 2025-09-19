// src/services/petsApiService.ts

import httpClient from "./httpClient";


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

// Categories
export async function getActiveCategories(): Promise<PetCategory[]> {
  const { data } = await httpClient.get('/pet-categories', {
    params: { active: true },
  });
  // backend may return { data } envelope or raw array
  return (data?.data ?? data) as PetCategory[];
}

// Pets
export async function listMyPets(page = 1, limit = 6) {
  const { data } = await httpClient.get('/pets', {
    params: { owner: 'me', page, limit },
  });
  // expected: { data, total, page, totalPages }
  return data;
}

export async function createPet(body: CreatePetBody) {
  const { data } = await httpClient.post('/pets', body, {
    headers: { 'Content-Type': 'application/json' },
  });
  // returns created pet object
  return data;
}

export async function uploadListingPhoto(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  // NO manual Content-Type header - let browser set multipart boundary
  const { data } = await httpClient.post('/marketplace/listings/photo', form);
  return data as { url: string };
}

export async function uploadPetPhoto(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await httpClient.post('/pet-uploads/photo', form);
  // Removed: headers: { 'Content-Type': 'multipart/form-data' }
  return data as { url: string };
}


export async function presignPetPhoto(contentType: string, ext?: string) {
  const { data } = await httpClient.post(
    '/uploads/pets/photo/presign',
    { contentType, ext },
    { headers: { 'Content-Type': 'application/json' } }
  );
  // returns { uploadUrl, publicUrl, key, expiresIn }
  return data;
}

export async function updatePet(id: string, patch: Partial<CreatePetBody>) {
  const { data } = await httpClient.patch(`/pets/${id}`, patch, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data; // updated pet
}

export async function deletePet(id: string) {
  const { data, status } = await httpClient.delete(`/pets/${id}`);
  // Some APIs return 204 with empty body; normalize to success boolean
  return status === 204 ? { success: true } : (data ?? { success: true });
}


