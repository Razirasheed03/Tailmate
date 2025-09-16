// src/mappers/listingMapper.ts
import type { ApiListingResponse } from '@/types/api.types';
import type { DomainListing } from '@/types/api.types';
import type { UIListing } from '@/types/api.types';

export class ListingMapper {
  // API to Domain mapping
  static apiToDomain(apiListing: ApiListingResponse): DomainListing {
    return {
      id: apiListing._id,
      title: apiListing.title,
      description: apiListing.description,
      photos: apiListing.photos,
      price: apiListing.price,
      type: apiListing.type,
      status: apiListing.status,
      ageText: apiListing.age_text,
      location: apiListing.place,
      contactInfo: apiListing.contact,
      ownerId: apiListing.user_id,
      createdAt: new Date(apiListing.created_at),
      updatedAt: new Date(apiListing.updated_at)
    };
  }

  // Domain to API mapping (for requests)
  static domainToApi(domainListing: Partial<DomainListing>): Partial<ApiListingResponse> {
    return {
      title: domainListing.title,
      description: domainListing.description,
      photos: domainListing.photos,
      price: domainListing.price,
      age_text: domainListing.ageText,
      place: domainListing.location,
      contact: domainListing.contactInfo
    };
  }

  // Domain to UI mapping
  static domainToUI(domainListing: DomainListing): UIListing {
    return {
      id: domainListing.id,
      title: domainListing.title,
      description: domainListing.description,
      primaryImage: domainListing.photos[0] || '',
      allImages: domainListing.photos,
      displayPrice: domainListing.price 
        ? `₹${domainListing.price.toLocaleString()}`
        : 'Free',
      type: domainListing.type,
      status: domainListing.status,
      age: domainListing.ageText || 'Not specified',
      location: domainListing.location,
      contact: domainListing.contactInfo,
      createdDate: ListingMapper.formatRelativeDate(domainListing.createdAt),
      statusColor: ListingMapper.getStatusColor(domainListing.status),
      typeLabel: domainListing.type === 'sell' ? 'For Sale' : 'For Adoption'
    };
  }

  // Helper methods
  private static formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
      } else {
        const years = Math.floor(diffInDays / 365);
        return `${years} year${years > 1 ? 's' : ''} ago`;
      }
    }
  }

  private static getStatusColor(status: string): string {
    const colors = {
      'active': 'text-green-600',
      'inactive': 'text-gray-600',
      'sold': 'text-blue-600',
      'adopted': 'text-purple-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  }

  // Batch mapping helpers
  static apiArrayToDomainArray(apiListings: ApiListingResponse[]): DomainListing[] {
    return apiListings.map(ListingMapper.apiToDomain);
  }

  static domainArrayToUIArray(domainListings: DomainListing[]): UIListing[] {
    return domainListings.map(ListingMapper.domainToUI);
  }
}
