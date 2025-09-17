// src/mappers/listingMapper.ts
import type { ApiListingResponse } from '@/types/api.types';
import type { DomainListing } from '@/types/api.types';
import type { UIListing } from '@/types/api.types';

export class ListingMapper {
  // API to Domain mapping
static apiToDomain(api: ApiListingResponse): DomainListing {
  // Safe date parsing with validation
  const parseDate = (dateString: string): Date => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return new Date(); // Fallback to current date
      }
      return date;
    } catch (error) {
      console.error('Date parsing error:', error);
      return new Date(); // Fallback to current date
    }
  };

  return {
    id: api._id,
    title: api.title,
    description: api.description,
    photos: api.photos || [],
    price: api.price,
    type: api.type,
    status: api.status,
    ageText: api.age_text,
    location: api.place,
    contactInfo: api.contact,
    ownerId: api.user_id,
    createdAt: parseDate(api.created_at),
    updatedAt: parseDate(api.updated_at)
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
    static domainToUI(domain: DomainListing): UIListing {
    // Safe date formatting with fallback
    const formatRelativeDate = (date: Date): string => {
      try {
        if (!date || isNaN(date.getTime())) {
          return 'Unknown date';
        }
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 1) return 'Today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 30) return `${diffDays} days ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
      } catch (error) {
        console.error('Date formatting error:', error);
        return 'Unknown date';
      }
    };

    // Safe price formatting
    const formatPrice = (price: number | null, type: string): string => {
      if (type === 'adopt' || price === null || price === 0) {
        return 'Free';
      }
      return `₹${price.toLocaleString('en-IN')}`;
    };

    return {
      id: domain.id,
      title: domain.title,
      description: domain.description,
      primaryImage: domain.photos[0] || '',
      allImages: domain.photos,
      displayPrice: formatPrice(domain.price, domain.type),
      type: domain.type,
      status: domain.status,
      age: domain.ageText ? `${domain.ageText} years` : 'Age not specified',
      location: domain.location,
      contact: domain.contactInfo,
      createdDate: formatRelativeDate(domain.createdAt),
      statusColor: domain.status === 'active' ? '#10B981' : '#6B7280',
      typeLabel: domain.type === 'sell' ? 'For Sale' : 'For Adoption'
    };
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

  static domainArrayToUIArray(domains: DomainListing[]): UIListing[] {
    return domains
      .filter(domain => domain && domain.createdAt) // Filter out invalid entries
      .map(domain => this.domainToUI(domain));
  }
}

