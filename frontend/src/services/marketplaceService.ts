// src/services/marketplaceService.ts
import { type AxiosResponse } from 'axios';
import type {
  ApiListingResponse,
  DomainListing,
} from '@/types/api.types';
import type{
    PaginatedResponse,
  ApiResponse,
  ListingSearchParams,
  ListingStatus,
  LegacyStatus
} from '@/types/marketplace.types'
import { ListingMapper } from '@/mappers/listingMapper';
import httpClient from './httpClient';

export const marketplaceService = {
  /**
   * Create a new marketplace listing - returns domain model
   */
  create: async (domainListing: Partial<DomainListing>): Promise<DomainListing> => {
    // Map domain to API format for request
    const apiPayload = ListingMapper.domainToApi(domainListing);
    
    const { data }: AxiosResponse<ApiResponse<ApiListingResponse>> = await httpClient.post(
      '/marketplace/listings', 
      apiPayload
    );
    
    const apiListing = data?.data ?? data;
    // Map API response back to domain model
    return ListingMapper.apiToDomain(apiListing);
  },

  /**
   * Get public marketplace listings - returns domain models
   */
  list: async (params: ListingSearchParams): Promise<PaginatedResponse<DomainListing>> => {
    const { data }: AxiosResponse<ApiResponse<PaginatedResponse<ApiListingResponse>>> = await httpClient.get(
      '/marketplace/listings', 
      { params }
    );
    
    const paginatedApiData = data?.data ?? data;
    
    // Map API listings to domain listings
    const domainListings = ListingMapper.apiArrayToDomainArray(paginatedApiData.data || []);
    
    return {
      ...paginatedApiData,
      data: domainListings
    };
  },

  /**
   * Get current user's listings - returns domain models
   */
  getUserListings: async (
    page: number = 1, 
    limit: number = 12
  ): Promise<PaginatedResponse<DomainListing>> => {
    const { data }: AxiosResponse<ApiResponse<PaginatedResponse<ApiListingResponse>>> = await httpClient.get(
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
    
    // Map API listings to domain listings
    const domainListings = ListingMapper.apiArrayToDomainArray(paginatedApiData.data || []);
    
    return {
      ...paginatedApiData,
      data: domainListings
    };
  },

  /**
   * Update a listing - returns domain model
   */
  updateListing: async (
    id: string, 
    domainUpdates: Partial<DomainListing>
  ): Promise<DomainListing> => {
    // Map domain updates to API format
    const apiPayload = ListingMapper.domainToApi(domainUpdates);
    
    const { data }: AxiosResponse<ApiResponse<ApiListingResponse>> = await httpClient.put(
      `/marketplace/listings/${id}`, 
      apiPayload
    );
    
    const apiListing = data?.data ?? data;
    // Map API response back to domain model
    return ListingMapper.apiToDomain(apiListing);
  },

  /**
   * Update listing status - returns domain model
   */
  updateListingStatus: async (
    id: string, 
    status: ListingStatus
  ): Promise<DomainListing> => {
    const { data }: AxiosResponse<ApiResponse<ApiListingResponse>> = await httpClient.patch(
      `/marketplace/listings/${id}/status`, 
      { status }
    );
    
    const apiListing = data?.data ?? data;
    return ListingMapper.apiToDomain(apiListing);
  },

  /**
   * Delete a user's listing
   */
  deleteListing: async (id: string): Promise<boolean> => {
    const response: AxiosResponse = await httpClient.delete(`/marketplace/listings/${id}`);
    return response.status === 204 || response.status === 200;
  },

  /**
   * Mark listing as sold or adopted - returns domain model
   */
  markAsSoldAdopted: async (
    id: string, 
    status: 'sold' | 'adopted'
  ): Promise<DomainListing> => {
    const { data }: AxiosResponse<ApiResponse<ApiListingResponse>> = await httpClient.patch(
      `/marketplace/listings/${id}/complete`, 
      { status }
    );
    
    const apiListing = data?.data ?? data;
    return ListingMapper.apiToDomain(apiListing);
  },

  // Legacy methods with improved types (keeping for backward compatibility)
  /**
   * @deprecated Use getUserListings instead
   */
  mine: async (
    page: number = 1, 
    limit: number = 12
  ): Promise<PaginatedResponse<DomainListing>> => {
    return await marketplaceService.getUserListings(page, limit);
  },

  /**
   * @deprecated Use updateListing instead
   */
  update: async (id: string, patch: Partial<DomainListing>): Promise<DomainListing> => {
    return await marketplaceService.updateListing(id, patch);
  },

  /**
   * Change listing status using legacy status mapping
   */
  changeStatus: async (
    id: string, 
    status: LegacyStatus
  ): Promise<DomainListing> => {
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
