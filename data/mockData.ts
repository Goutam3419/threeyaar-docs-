export interface Agent {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: string;
  rating: number;
  users: string; // Used for "Downloads" or active users
  price: string;
  image: string; // Cover image
  iconName: string; // Lucide icon name
  badge?: string;
  developer: string;
  verified: boolean;
  features: string[];
  screenshots: string[];
  permissions: string[];
  version: string;
  lastUpdated: string;
  pricingType: 'Free' | 'Subscription' | 'Usage-based';
  pricingDetails: string;
  reviews: {
    id: string;
    userName: string;
    role: string;
    rating: number;
    comment: string;
    date: string;
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// A plan's price is intentionally NOT hardcoded here. Amount and currency are
// managed from the Admin Panel and will be populated from the database once
// backend integration is live. `priceAmount: null` means "not yet configured".
export interface PricingPlan {
  id: string;
  name: string;
  priceAmount: number | null;
  currency: string | null;
  billingPeriod: 'monthly' | 'yearly' | 'custom';
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}

export const CATEGORIES = [
  'All Categories',
  'Website Builder',
  'Video Creator',
  'Image Generator',
  'SEO',
  'Marketing',
  'Sales',
  'Customer Support',
  'HR',
  'Finance',
  'Automation',
  'Writing',
  'Research',
  'Coding',
  'Design',
  'Productivity',
  'Analytics',
  'Education',
  'Legal',
  'Healthcare',
  'E-commerce'
];

// Populated from the marketplace database once backend integration is live.
export const POPULAR_AGENTS: Agent[] = [];

// Populated from verified customer reviews once backend integration is live.
export const TESTIMONIALS: Testimonial[] = [];

// Plan names, descriptions and feature lists are editorial content set by the
// business. Prices are deliberately left unset (`priceAmount: null`) — the
// Admin Panel will manage pricing plans and currency once backend is live.
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter Workspace',
    priceAmount: null,
    currency: null,
    billingPeriod: 'monthly',
    description: 'Perfect for small business owners and solopreneurs exploring autonomous business workflows.',
    features: [
      'Access to free Business Agents',
      'Deploy a limited number of active agents',
      'Standard priority task queue',
      'Secure connections to your business tools',
      'Monthly task allowance'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    id: 'growth',
    name: 'Business Growth',
    priceAmount: null,
    currency: null,
    billingPeriod: 'monthly',
    description: 'Best for scaling brands, stores, and service companies looking to automate day-to-day operations.',
    features: [
      'Access to all premium Business Agents',
      'Deploy unlimited active agents',
      'High-priority task processing',
      'Multi-user workspace with team members',
      'Advanced integrations with your business tools',
      'Higher monthly task allowance with detailed reporting'
    ],
    cta: 'Upgrade to Growth',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise Automation',
    priceAmount: null,
    currency: null,
    billingPeriod: 'custom',
    description: 'For companies requiring custom agent training, dedicated support, and custom service agreements.',
    features: [
      'Private company-only agent catalog',
      'Enterprise-grade security and data isolation',
      'Custom business agent design and training service',
      'Dedicated Customer Success & onboarding specialist',
      'Guaranteed service levels and unlimited tasks'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do these AI Business Agents work?',
    answer: 'AI business agents on our marketplace are custom software operators trained for specific business roles like SEO optimization, customer support, or copywriting. Once connected to your workspace tools (e.g., your email, Shopify, or social channels), they autonomously gather data, plan actions, and execute tasks to help grow and run your business.'
  },
  {
    id: 'faq-2',
    question: 'Do I need any programming experience to use these agents?',
    answer: 'None at all. This platform is custom-built for business owners and managers. Setting up agents is as simple as filling out basic settings in plain English and authorizing safe integrations with your existing tools via secure OAuth clicks.'
  },
  {
    id: 'faq-3',
    question: 'How secure is our confidential business data?',
    answer: 'Security is our highest priority. All agent actions occur in isolated, secure environments. Keys, tokens, and transaction data are protected with strong encryption. You maintain full authority to define, restrict, or revoke access permissions instantly.'
  },
  {
    id: 'faq-4',
    question: 'Can I trial premium business agents before subscribing?',
    answer: 'Most premium agents include a free trial so you can verify their business performance before committing to a paid plan.'
  }
];
