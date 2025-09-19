// src/services/marketplaceService.ts
import { type AxiosResponse } from 'axios';
import type {
  PaginatedResponse,
  ApiResponse,
  ListingSearchParams,
  ListingStatus,
  LegacyStatus
} from '@/types/marketplace.types'
import httpClient from './httpClient';

export const marketplaceService = {
  /**
   * Create a new marketplace listing - returns raw API data
   */
  create: async (listingData: any): Promise<any> => {
    const { data }: AxiosResponse<ApiResponse<any>> = await httpClient.post(
      '/marketplace/listings', 
      listingData
    );
    
    return data?.data ?? data;
  },

  /**
   * Get public marketplace listings - returns raw API data
   */
  list: async (params: ListingSearchParams): Promise<PaginatedResponse<any>> => {
    const { data }: AxiosResponse<ApiResponse<PaginatedResponse<any>>> = await httpClient.get(
      '/marketplace/listings', 
      { params }
    );
    
    const paginatedApiData = data?.data ?? data;
    
    // Return raw API data directly
    return {
      data: paginatedApiData.data || [],
      page: paginatedApiData.page || 1,
      total: paginatedApiData.total || 0,
      totalPages: paginatedApiData.totalPages || 1
    };
  },

  /**
   * Get current user's listings - returns raw API data
   */
  getUserListings: async (
    page: number = 1, 
    limit: number = 12
  ): Promise<PaginatedResponse<any>> => {
    const { data }: AxiosResponse<ApiResponse<PaginatedResponse<any>>> = await httpClient.get(
      '/marketplace/listings/mine', 
      { params: { page, limit } }
    );
    
    let paginatedApiData;
    
    // Handle the nested response structure
    if (data?.success && data?.data) {
      paginatedApiData = data.data;
    } else {
      paginatedApiData = data?.data ?? data;
    }
    
    // Return raw API data directly
    return {
      data: paginatedApiData.data || [],
      page: paginatedApiData.page || page,
      // limit: paginatedApiData.limit || limit,
      total: paginatedApiData.total || 0,
      totalPages: paginatedApiData.totalPages || 1
    };
  },

  /**
   * Update a listing - returns raw API data
   */
  updateListing: async (
    id: string, 
    updateData: any
  ): Promise<any> => {
    const { data }: AxiosResponse<ApiResponse<any>> = await httpClient.put(
      `/marketplace/listings/${id}`, 
      updateData
    );
    
    return data?.data ?? data;
  },

  /**
   * Update listing status - returns raw API data
   */
  updateListingStatus: async (
    id: string, 
    status: ListingStatus
  ): Promise<any> => {
    const { data }: AxiosResponse<ApiResponse<any>> = await httpClient.patch(
      `/marketplace/listings/${id}/status`, 
      { status }
    );
    
    return data?.data ?? data;
  },

  /**
   * Delete a user's listing
   */
  deleteListing: async (id: string): Promise<boolean> => {
    const response: AxiosResponse = await httpClient.delete(`/marketplace/listings/${id}`);
    return response.status === 204 || response.status === 200;
  },

  /**
   * Mark listing as sold or adopted - returns raw API data
   */
  markAsSoldAdopted: async (
    id: string, 
    status: 'sold' | 'adopted'
  ): Promise<any> => {
    const { data }: AxiosResponse<ApiResponse<any>> = await httpClient.patch(
      `/marketplace/listings/${id}/complete`, 
      { status }
    );
    
    return data?.data ?? data;
  },

  // Legacy methods (keeping for backward compatibility)
  /**
   * @deprecated Use getUserListings instead
   */
  mine: async (
    page: number = 1, 
    limit: number = 12
  ): Promise<PaginatedResponse<any>> => {
    return await marketplaceService.getUserListings(page, limit);
  },

  /**
   * @deprecated Use updateListing instead
   */
  update: async (id: string, patch: any): Promise<any> => {
    return await marketplaceService.updateListing(id, patch);
  },

  /**
   * Change listing status using legacy status mapping
   */
  changeStatus: async (
    id: string, 
    status: LegacyStatus
  ): Promise<any> => {
    const statusMap: Record<LegacyStatus, ListingStatus> = {
      'active': 'active',
      'reserved': 'inactive',
      'closed': 'inactive'
    };
    
    const mappedStatus = statusMap[status];
    return await marketplaceService.updateListingStatus(id, mappedStatus);
  },

  /**
   * @deprecated Use deleteListing instead
   */
  remove: async (id: string): Promise<boolean> => {
    return await marketplaceService.deleteListing(id);
  },
} as const;

// Export type for the service
export type MarketplaceService = typeof marketplaceService;
