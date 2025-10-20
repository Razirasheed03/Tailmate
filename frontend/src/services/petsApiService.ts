// src/services/petsApiService.ts
import httpClient from "./httpClient";
import type { PetCategory, CreatePetBody } from "@/types/pets.types";

export async function getActiveCategories(): Promise<PetCategory[]> {
  const { data } = await httpClient.get('/pet-categories', { params: { active: true } });
  return (data?.data ?? data) as PetCategory[];
}

export async function listMyPets(page = 1, limit = 6) {
  const { data } = await httpClient.get('/pets', { params: { owner: 'me', page, limit } });
  return data; // expected: { data, total, page, totalPages }
}

export async function getPetHistory(petId: string) {
  const { data } = await httpClient.get(`/pets/${petId}/history`);
  return data?.data || data; // Return the pet with populated history
}

export async function createPet(body: CreatePetBody) {
  const { data } = await httpClient.post('/pets', body, { headers: { 'Content-Type': 'application/json' } });
  return data; // created pet
}

export async function uploadListingPhoto(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await httpClient.post('/marketplace/listings/photo', form);
  return data as { url: string };
}

export async function uploadPetPhoto(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('avatar', file, file.name);
  const { data } = await httpClient.post('/pet-uploads/photo', form);
  return data as { url: string };
}

export async function presignPetPhoto(contentType: string, ext?: string) {
  const { data } = await httpClient.post('/uploads/pets/photo/presign', { contentType, ext }, { headers: { 'Content-Type': 'application/json' } });
  return data; // { uploadUrl, publicUrl, key, expiresIn }
}

export async function updatePet(id: string, patch: any) {
  return httpClient.patch(`/pets/${id}`, patch);
}

export async function deletePet(id: string) {
  return httpClient.delete(`/pets/${id}`);
}