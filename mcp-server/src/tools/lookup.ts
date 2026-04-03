import { z } from "zod";

// ── App Library (mirrors src/lib/types.ts DEFAULT_INDIAN_APPS) ──────

interface AppOption {
  name: string;
  category: string;
  icon: string;
}

const APP_LIBRARY: AppOption[] = [
  // Payment & Cash
  { name: "Cash", category: "General", icon: "💵" },
  { name: "Other", category: "General", icon: "📱" },
  // Food Delivery
  { name: "Swiggy", category: "Food & Dining", icon: "🟠" },
  { name: "Zomato", category: "Food & Dining", icon: "🔴" },
  { name: "UberEats", category: "Food & Dining", icon: "🛵" },
  { name: "Dunzo", category: "Food & Dining", icon: "🎯" },
  // E-commerce & Shopping
  { name: "Amazon", category: "Shopping", icon: "📦" },
  { name: "Flipkart", category: "Shopping", icon: "🛒" },
  { name: "Myntra", category: "Shopping", icon: "👗" },
  { name: "Nykaa", category: "Shopping", icon: "💄" },
  { name: "BigBasket", category: "Shopping", icon: "🥬" },
  { name: "Grofers/Blinkit", category: "Shopping", icon: "🛍️" },
  { name: "JioMart", category: "Shopping", icon: "🏪" },
  { name: "Meesho", category: "Shopping", icon: "🎁" },
  // Transportation
  { name: "Ola", category: "Transportation", icon: "🚖" },
  { name: "Uber", category: "Transportation", icon: "🚕" },
  { name: "Rapido", category: "Transportation", icon: "🏍️" },
  { name: "Metro", category: "Transportation", icon: "🚇" },
  { name: "IRCTC", category: "Transportation", icon: "🚅" },
  { name: "RedBus", category: "Transportation", icon: "🚌" },
  // Entertainment & OTT
  { name: "Netflix", category: "Entertainment", icon: "🎬" },
  { name: "Amazon Prime", category: "Entertainment", icon: "📺" },
  { name: "Disney+ Hotstar", category: "Entertainment", icon: "⭐" },
  { name: "Zee5", category: "Entertainment", icon: "📱" },
  { name: "SonyLIV", category: "Entertainment", icon: "📽️" },
  { name: "YouTube Premium", category: "Entertainment", icon: "▶️" },
  { name: "Spotify", category: "Entertainment", icon: "🎵" },
  { name: "BookMyShow", category: "Entertainment", icon: "🎭" },
  // Financial & Payment Apps
  { name: "Paytm", category: "Bills & Utilities", icon: "💳" },
  { name: "PhonePe", category: "Bills & Utilities", icon: "📱" },
  { name: "Google Pay", category: "Bills & Utilities", icon: "💰" },
  { name: "CRED", category: "Bills & Utilities", icon: "💎" },
  { name: "MobiKwik", category: "Bills & Utilities", icon: "🔵" },
  // Healthcare
  { name: "Practo", category: "Healthcare", icon: "👨‍⚕️" },
  { name: "1mg", category: "Healthcare", icon: "💊" },
  { name: "PharmEasy", category: "Healthcare", icon: "⚕️" },
  // Education
  { name: "BYJU'S", category: "Education", icon: "📚" },
  { name: "Unacademy", category: "Education", icon: "🎓" },
  { name: "Vedantu", category: "Education", icon: "📖" },
  // Travel
  { name: "MakeMyTrip", category: "Travel", icon: "✈️" },
  { name: "Cleartrip", category: "Travel", icon: "🧳" },
  { name: "Goibibo", category: "Travel", icon: "🏨" },
  { name: "OYO", category: "Travel", icon: "🏩" },
  { name: "Airbnb", category: "Travel", icon: "🏠" },
];

// ── Schemas ─────────────────────────────────────────────────────────

export const SearchAppsSchema = z.object({
  query: z
    .string()
    .optional()
    .describe(
      "Search term to match against app names (case-insensitive, partial match). Omit to list all apps."
    ),
  category: z
    .string()
    .optional()
    .describe(
      "Filter by category (e.g. Food & Dining, Shopping, Transportation)"
    ),
});

// ── Tool implementation ─────────────────────────────────────────────

export function searchApps(params: z.infer<typeof SearchAppsSchema>) {
  let results = APP_LIBRARY;

  if (params.category) {
    const cat = params.category.toLowerCase();
    results = results.filter((a) => a.category.toLowerCase() === cat);
  }

  if (params.query) {
    const q = params.query.toLowerCase();
    results = results.filter((a) => a.name.toLowerCase().includes(q));
  }

  const categories = [...new Set(results.map((a) => a.category))];

  return {
    total: results.length,
    categories,
    apps: results.map((a) => ({
      name: a.name,
      category: a.category,
      icon: a.icon,
    })),
  };
}
