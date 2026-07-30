import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  type QueryDocumentSnapshot,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { uploadAgentIcon, uploadAgentCoverImage, uploadAgentScreenshot } from '@/lib/firebase/storage';
import { COLLECTIONS, type AgentDoc, type AgentPricingType } from '@/types/firestore';

const AGENTS_COL = COLLECTIONS.AGENTS;

export type SortOption = 'popular' | 'rating' | 'newest' | 'featured';

export interface AgentFilters {
  category?: string; // 'All Categories' means no filter
  pricingType?: AgentPricingType | 'All';
  sort?: SortOption;
}

export interface AgentsPage {
  agents: AgentDoc[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

const PAGE_SIZE = 12;

function buildBaseQuery(filters: AgentFilters) {
  const constraints = [where('status', '==', 'published')];

  if (filters.category && filters.category !== 'All Categories') {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters.pricingType && filters.pricingType !== 'All') {
    constraints.push(where('pricingType', '==', filters.pricingType));
  }

  let orderField: 'downloads' | 'rating' | 'createdAt' | 'featured' = 'downloads';
  if (filters.sort === 'rating') orderField = 'rating';
  else if (filters.sort === 'newest') orderField = 'createdAt';
  else if (filters.sort === 'featured') orderField = 'featured';

  return query(collection(db, AGENTS_COL), ...constraints, orderBy(orderField, 'desc'), limit(PAGE_SIZE));
}

/**
 * Live-subscribes to the first page of the marketplace so newly published /
 * edited / hidden agents reflect immediately without a manual refresh.
 * Use `fetchNextAgentsPage` (one-time reads) for pagination beyond page 1.
 */
export function subscribeToAgents(
  filters: AgentFilters,
  callback: (page: AgentsPage) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = buildBaseQuery(filters);
  return onSnapshot(
    q,
    (snap) => {
      const agents = snap.docs.map((d) => d.data() as AgentDoc);
      callback({
        agents,
        lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
        hasMore: snap.docs.length === PAGE_SIZE,
      });
    },
    (err) => onError(err as Error)
  );
}

/** One-time fetch of the next page, given the last document from the previous page. */
export async function fetchNextAgentsPage(
  filters: AgentFilters,
  lastDoc: QueryDocumentSnapshot<DocumentData>
): Promise<AgentsPage> {
  const constraints = [where('status', '==', 'published')];
  if (filters.category && filters.category !== 'All Categories') {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters.pricingType && filters.pricingType !== 'All') {
    constraints.push(where('pricingType', '==', filters.pricingType));
  }

  let orderField: 'downloads' | 'rating' | 'createdAt' | 'featured' = 'downloads';
  if (filters.sort === 'rating') orderField = 'rating';
  else if (filters.sort === 'newest') orderField = 'createdAt';
  else if (filters.sort === 'featured') orderField = 'featured';

  const q = query(
    collection(db, AGENTS_COL),
    ...constraints,
    orderBy(orderField, 'desc'),
    startAfter(lastDoc),
    limit(PAGE_SIZE)
  );
  const snap = await getDocs(q);
  const agents = snap.docs.map((d) => d.data() as AgentDoc);
  return {
    agents,
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
    hasMore: snap.docs.length === PAGE_SIZE,
  };
}

export async function fetchAgentById(id: string): Promise<AgentDoc | null> {
  const snap = await getDoc(doc(db, AGENTS_COL, id));
  return snap.exists() ? (snap.data() as AgentDoc) : null;
}

export async function fetchRelatedAgents(category: string, excludeId: string, max = 4): Promise<AgentDoc[]> {
  const q = query(
    collection(db, AGENTS_COL),
    where('status', '==', 'published'),
    where('category', '==', category),
    limit(max + 1)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as AgentDoc)
    .filter((a) => a.id !== excludeId)
    .slice(0, max);
}

/** All agents regardless of status — used by the Admin Panel's Agent Management tab. */
export function subscribeToAllAgentsForAdmin(
  callback: (agents: AgentDoc[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, AGENTS_COL), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as AgentDoc)),
    (err) => onError(err as Error)
  );
}

// ---------- Admin CRUD ----------

export interface CreateAgentInput {
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  developer: string;
  developerId: string;
  version: string;
  price: number | null;
  currency: string | null;
  pricingType: AgentPricingType;
  tags: string[];
  features: string[];
  requirements: string[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createAgentDoc(input: CreateAgentInput): Promise<AgentDoc> {
  const id = doc(collection(db, AGENTS_COL)).id;
  const now = new Date().toISOString();
  const agent: AgentDoc = {
    id,
    name: input.name,
    slug: `${slugify(input.name)}-${id.slice(0, 6)}`,
    description: input.description,
    shortDescription: input.shortDescription,
    icon: '',
    coverImage: '',
    category: input.category,
    developer: input.developer,
    developerId: input.developerId,
    version: input.version || '1.0.0',
    price: input.price,
    currency: input.currency,
    pricingType: input.pricingType,
    rating: 0,
    reviews: [],
    downloads: 0,
    tags: input.tags,
    screenshots: [],
    features: input.features,
    requirements: input.requirements,
    status: 'draft',
    featured: false,
    popular: false,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, AGENTS_COL, id), agent);
  return agent;
}

export async function updateAgentDoc(id: string, updates: Partial<AgentDoc>): Promise<void> {
  await updateDoc(doc(db, AGENTS_COL, id), { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteAgentDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, AGENTS_COL, id));
}

export async function setAgentStatus(id: string, status: AgentDoc['status']): Promise<void> {
  await updateAgentDoc(id, { status });
}

export async function setAgentFeatured(id: string, featured: boolean): Promise<void> {
  await updateAgentDoc(id, { featured });
}

// ---------- Admin asset uploads ----------

export async function setAgentIcon(id: string, file: File): Promise<string> {
  const url = await uploadAgentIcon(id, file);
  await updateAgentDoc(id, { icon: url });
  return url;
}

export async function setAgentCoverImage(id: string, file: File): Promise<string> {
  const url = await uploadAgentCoverImage(id, file);
  await updateAgentDoc(id, { coverImage: url });
  return url;
}

export async function addAgentScreenshot(id: string, file: File, existing: string[]): Promise<string[]> {
  const url = await uploadAgentScreenshot(id, file);
  const next = [...existing, url];
  await updateAgentDoc(id, { screenshots: next });
  return next;
}
