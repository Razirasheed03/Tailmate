
// // src/types/domain.types.ts - Domain layer models
// export interface DomainListing {
//   id: string;
//   title: string;
//   description: string;
//   photos: string[];
//   price: number | null;
//   type: 'sell' | 'adopt';
//   status: 'active' | 'inactive' | 'sold' | 'adopted';
//   ageText?: number; // Domain uses camelCase
//   location: string;
//   contactInfo: string;
//   ownerId: string;
//   createdAt: Date; // Domain uses Date objects
//   updatedAt: Date;
// }

// // src/types/ui.types.ts - UI layer models
// export interface UIListing {
//   id: string;
//   title: string;
//   description: string;
//   primaryImage: string;
//   allImages: string[];
//   displayPrice: string; // Formatted price like "₹1,000" or "Free"
//   type: 'sell' | 'adopt';
//   status: 'active' | 'inactive' | 'sold' | 'adopted';
//   age: string;
//   location: string;
//   contact: string;
//   createdDate: string; // Formatted date like "2 days ago"
//   statusColor: string; // UI-specific styling
//   typeLabel: string; // "For Sale" or "For Adoption"
// }
