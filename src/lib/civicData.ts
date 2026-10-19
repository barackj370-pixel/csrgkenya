import { supabase } from './supabase';

// ==========================================
// MOCK DATA PURGING FILTER
// ==========================================
const MOCK_IDS = new Set([
  'ad-sample-1',
  'blog-1', 'blog-2', 'blog-3',
  'act-1', 'act-2', 'act-3',
  'sit-1', 'sit-2',
  'res-track-1', 'res-track-2', 'res-track-3',
  'cand-1', 'cand-2', 'cand-3',
  'nat-1', 'nat-2', 'nat-3',
  'arch-1', 'arch-2', 'arch-3'
]);

export function filterMockItems<T extends { id: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter(item => !MOCK_IDS.has(item.id));
}

export function generateCleanId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// ==========================================
// 1. CAROUSEL ADS
// ==========================================
export interface CarouselAd {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  imageUrl?: string;
  ctaText: string;
  ctaLink: string;
  daysVisible: number;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string
  isExpired: boolean;
  daysLeft: number;
  createdBy?: string;
}

const DEFAULT_ADS: CarouselAd[] = [];

export async function getActiveCarouselAds(): Promise<CarouselAd[]> {
  const now = Date.now();
  try {
    const { data, error } = await supabase.from('CarouselAd').select('*');
    if (!error && data && data.length > 0) {
      return filterMockItems(data)
        .map((ad: any) => {
          const createdTime = new Date(ad.createdAt).getTime();
          const expireTime = createdTime + (Number(ad.daysVisible) || 7) * 24 * 60 * 60 * 1000;
          const isExpired = now >= expireTime;
          const daysLeft = Math.max(0, Math.ceil((expireTime - now) / (1000 * 60 * 60 * 24)));
          return {
            ...ad,
            expiresAt: new Date(expireTime).toISOString(),
            isExpired,
            daysLeft
          };
        })
        .filter((ad: CarouselAd) => !ad.isExpired);
    }
  } catch (err) {
    console.warn('Supabase CarouselAd query failed, reading from local cache:', err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem('csrg_carousel_ads_v1');
    const list: CarouselAd[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_ADS;
    return list
      .map(ad => {
        const createdTime = new Date(ad.createdAt).getTime();
        const expireTime = createdTime + (Number(ad.daysVisible) || 7) * 24 * 60 * 60 * 1000;
        const isExpired = now >= expireTime;
        const daysLeft = Math.max(0, Math.ceil((expireTime - now) / (1000 * 60 * 60 * 24)));
        return {
          ...ad,
          expiresAt: new Date(expireTime).toISOString(),
          isExpired,
          daysLeft
        };
      })
      .filter(ad => !ad.isExpired);
  } catch {
    return DEFAULT_ADS;
  }
}

export async function getAllCarouselAds(): Promise<CarouselAd[]> {
  const now = Date.now();
  try {
    const { data, error } = await supabase.from('CarouselAd').select('*');
    if (!error && data && data.length > 0) {
      return filterMockItems(data).map((ad: any) => {
        const createdTime = new Date(ad.createdAt).getTime();
        const expireTime = createdTime + (Number(ad.daysVisible) || 7) * 24 * 60 * 60 * 1000;
        return {
          ...ad,
          expiresAt: new Date(expireTime).toISOString(),
          isExpired: now >= expireTime,
          daysLeft: Math.max(0, Math.ceil((expireTime - now) / (1000 * 60 * 60 * 24)))
        };
      });
    }
  } catch (err) {
    // fallback
  }

  try {
    const raw = localStorage.getItem('csrg_carousel_ads_v1');
    const list: CarouselAd[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_ADS;
    return list.map(ad => {
      const createdTime = new Date(ad.createdAt).getTime();
      const expireTime = createdTime + (Number(ad.daysVisible) || 7) * 24 * 60 * 60 * 1000;
      return {
        ...ad,
        expiresAt: new Date(expireTime).toISOString(),
        isExpired: now >= expireTime,
        daysLeft: Math.max(0, Math.ceil((expireTime - now) / (1000 * 60 * 60 * 24)))
      };
    });
  } catch {
    return DEFAULT_ADS;
  }
}

export async function saveCarouselAd(ad: Omit<CarouselAd, 'id' | 'createdAt' | 'expiresAt' | 'isExpired' | 'daysLeft'>): Promise<CarouselAd> {
  const now = new Date();
  const days = Number(ad.daysVisible) || 7;
  const expireDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const newAd: CarouselAd = {
    ...ad,
    id: generateCleanId('ad'),
    createdAt: now.toISOString(),
    expiresAt: expireDate.toISOString(),
    isExpired: false,
    daysLeft: days
  };

  try {
    await supabase.from('CarouselAd').insert([newAd]);
  } catch (err) {
    console.warn('Could not save CarouselAd to Supabase, saving to local store:', err);
  }

  try {
    const raw = localStorage.getItem('csrg_carousel_ads_v1');
    const current: CarouselAd[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_ADS;
    const updated = [newAd, ...current];
    localStorage.setItem('csrg_carousel_ads_v1', JSON.stringify(updated));
  } catch {
    // ignore
  }

  return newAd;
}

export async function deleteCarouselAd(id: string): Promise<void> {
  try {
    await supabase.from('CarouselAd').delete().eq('id', id);
  } catch {
    // ignore
  }
  try {
    const raw = localStorage.getItem('csrg_carousel_ads_v1');
    if (raw) {
      const current: CarouselAd[] = JSON.parse(raw);
      localStorage.setItem('csrg_carousel_ads_v1', JSON.stringify(current.filter(a => a.id !== id)));
    }
  } catch {
    // ignore
  }
}

// ==========================================
// 2. BLOG ARTICLES
// ==========================================
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  authorRole?: string;
  publishedAt: string;
  readTime: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  views?: number;
  tags?: string[];
  isFeatured?: boolean;
  newsScope?: 'NATIONAL' | 'COUNTY' | 'WARD';
  county?: string;
  wardName?: string;
  wardId?: string;
  createdAt?: string;
}

const DEFAULT_BLOGS: BlogPost[] = [];

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabase.from('BlogPost').select('*').order('publishedAt', { ascending: false });
    if (!error && data && data.length > 0) {
      return filterMockItems(data);
    }
  } catch (err) {
    console.warn('Supabase BlogPost query failed, reading local cache:', err);
  }

  try {
    const raw = localStorage.getItem('csrg_blog_posts_v1');
    return raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_BLOGS;
  } catch {
    return DEFAULT_BLOGS;
  }
}

export async function saveBlogPost(post: Omit<BlogPost, 'id' | 'views'>): Promise<BlogPost> {
  const newPost: BlogPost = {
    ...post,
    id: generateCleanId('blog'),
    views: 1,
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('BlogPost').insert([newPost]);
  } catch (err) {
    console.warn('Could not save BlogPost to Supabase, saving locally:', err);
  }

  try {
    const raw = localStorage.getItem('csrg_blog_posts_v1');
    const current: BlogPost[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_BLOGS;
    const updated = [newPost, ...current.filter(p => p.slug !== newPost.slug)];
    localStorage.setItem('csrg_blog_posts_v1', JSON.stringify(updated));
  } catch {
    // ignore
  }

  return newPost;
}

export async function deleteBlogPost(id: string): Promise<void> {
  try {
    await supabase.from('BlogPost').delete().eq('id', id);
  } catch {
    // ignore
  }
  try {
    const raw = localStorage.getItem('csrg_blog_posts_v1');
    if (raw) {
      const current: BlogPost[] = JSON.parse(raw);
      localStorage.setItem('csrg_blog_posts_v1', JSON.stringify(current.filter(p => p.id !== id)));
    }
  } catch {
    // ignore
  }
}

// ==========================================
// 3. GROUP & MINI-CAUCUS ACTIVITIES & WALLS
// ==========================================
export interface GroupActivity {
  id: string;
  groupId?: string;
  wardId: string;
  wardName?: string;
  groupName: string;
  title: string;
  category: 'Field Action & Harambee' | 'Citizen Caucus Meeting' | 'Public Service Inspection' | 'Agroecology & Kitchen Gardens' | 'Youth & Women Empowerment';
  activityDate: string;
  venue: string;
  description: string;
  keyOutcomes: string;
  participantCount: number;
  imageUrl?: string;
  cheersCount: number;
  postedBy: string;
  createdAt: string;
}

const DEFAULT_ACTIVITIES: GroupActivity[] = [];

export async function getGroupActivities(wardId?: string, groupId?: string): Promise<GroupActivity[]> {
  try {
    let query = supabase.from('GroupActivity').select('*').order('activityDate', { ascending: false });
    if (groupId) {
      query = query.eq('groupId', groupId);
    } else if (wardId) {
      query = query.eq('wardId', wardId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return filterMockItems(data);
    }
  } catch (err) {
    console.warn('GroupActivity query failed, using local cache:', err);
  }

  try {
    const raw = localStorage.getItem('csrg_group_activities_v1');
    const list: GroupActivity[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_ACTIVITIES;
    if (groupId) {
      return list.filter(a => a.groupId === groupId);
    }
    if (wardId) {
      return list.filter(a => a.wardId === wardId);
    }
    return list;
  } catch {
    return DEFAULT_ACTIVITIES;
  }
}

export async function saveGroupActivity(activity: Omit<GroupActivity, 'id' | 'createdAt' | 'cheersCount'>): Promise<GroupActivity> {
  const newActivity: GroupActivity = {
    ...activity,
    id: generateCleanId('act'),
    cheersCount: 1,
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('GroupActivity').insert([newActivity]);
  } catch (err) {
    console.warn('Failed to insert GroupActivity to Supabase, saving to local store:', err);
  }

  try {
    const raw = localStorage.getItem('csrg_group_activities_v1');
    const current: GroupActivity[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_ACTIVITIES;
    localStorage.setItem('csrg_group_activities_v1', JSON.stringify([newActivity, ...current]));
  } catch {
    // ignore
  }

  return newActivity;
}

export async function cheerGroupActivity(id: string): Promise<number> {
  let count = 1;
  try {
    const raw = localStorage.getItem('csrg_group_activities_v1');
    const current: GroupActivity[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_ACTIVITIES;
    const item = current.find(a => a.id === id);
    if (item) {
      item.cheersCount = (item.cheersCount || 0) + 1;
      count = item.cheersCount;
      localStorage.setItem('csrg_group_activities_v1', JSON.stringify(current));
    }
  } catch {
    // ignore
  }
  return count;
}

// ==========================================
// 3B. GROUP MINI-CAUCUS ISSUES & RESOLUTIONS
// ==========================================
export interface GroupWallIssue {
  id: string;
  groupId: string;
  wardId: string;
  groupName?: string;
  wardName?: string;
  title: string;
  description: string;
  proposedSolution?: string;
  category?: string;
  votes: number;
  votedUserIds?: string[];
  submittedBy: string;
  status: 'DELIBERATING' | 'ESCALATED_TO_ASSEMBLY' | 'RESOLVED';
  createdAt: string;
}

export interface GroupWallResolution {
  id: string;
  groupId: string;
  wardId: string;
  groupName: string;
  wardName: string;
  title: string;
  summary: string;
  actionPoints?: string[];
  adoptedDate: string;
  certifiedBy: string;
  certifiedRole: string;
  resolutionNumber?: string;
  supportCount: number;
  createdAt: string;
}

export async function getGroupWallIssues(groupId: string): Promise<GroupWallIssue[]> {
  try {
    const { data, error } = await supabase.from('GroupIssue').select('*').eq('groupId', groupId).order('votes', { ascending: false });
    if (!error && data && data.length > 0) {
      return filterMockItems(data);
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(`csrg_grp_issues_${groupId}`);
    if (raw) {
      return filterMockItems(JSON.parse(raw));
    }
  } catch {
    // ignore
  }

  return [];
}

export async function saveGroupWallIssue(issue: Omit<GroupWallIssue, 'id' | 'votes' | 'votedUserIds' | 'createdAt'>): Promise<GroupWallIssue> {
  const newIssue: GroupWallIssue = {
    ...issue,
    id: generateCleanId('gissue'),
    votes: 1,
    votedUserIds: [],
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('GroupIssue').insert([newIssue]);
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(`csrg_grp_issues_${issue.groupId}`);
    const list: GroupWallIssue[] = raw ? filterMockItems(JSON.parse(raw)) : [];
    localStorage.setItem(`csrg_grp_issues_${issue.groupId}`, JSON.stringify([newIssue, ...list]));
  } catch {
    // ignore
  }

  return newIssue;
}

export async function voteGroupWallIssue(id: string, groupId: string, voterId?: string): Promise<number> {
  let count = 1;
  try {
    const raw = localStorage.getItem(`csrg_grp_issues_${groupId}`);
    if (raw) {
      const list: GroupWallIssue[] = JSON.parse(raw);
      const item = list.find(it => it.id === id);
      if (item) {
        item.votes = (item.votes || 0) + 1;
        count = item.votes;
        localStorage.setItem(`csrg_grp_issues_${groupId}`, JSON.stringify(list));
      }
    }
  } catch {
    // ignore
  }
  return count;
}

export async function getGroupWallResolutions(groupId: string): Promise<GroupWallResolution[]> {
  try {
    const { data, error } = await supabase.from('GroupResolution').select('*').eq('groupId', groupId).order('adoptedDate', { ascending: false });
    if (!error && data && data.length > 0) {
      return filterMockItems(data);
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(`csrg_grp_resolutions_${groupId}`);
    if (raw) {
      return filterMockItems(JSON.parse(raw));
    }
  } catch {
    // ignore
  }

  return [];
}

export async function saveGroupWallResolution(res: Omit<GroupWallResolution, 'id' | 'supportCount' | 'createdAt'>): Promise<GroupWallResolution> {
  const newRes: GroupWallResolution = {
    ...res,
    id: generateCleanId('gres'),
    resolutionNumber: `RES-${Date.now().toString().slice(-4)}`,
    supportCount: 1,
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('GroupResolution').insert([newRes]);
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(`csrg_grp_resolutions_${res.groupId}`);
    const list: GroupWallResolution[] = raw ? filterMockItems(JSON.parse(raw)) : [];
    localStorage.setItem(`csrg_grp_resolutions_${res.groupId}`, JSON.stringify([newRes, ...list]));
  } catch {
    // ignore
  }

  return newRes;
}

export async function supportGroupWallResolution(id: string, groupId: string): Promise<number> {
  let count = 1;
  try {
    const raw = localStorage.getItem(`csrg_grp_resolutions_${groupId}`);
    if (raw) {
      const list: GroupWallResolution[] = JSON.parse(raw);
      const item = list.find(it => it.id === id);
      if (item) {
        item.supportCount = (item.supportCount || 0) + 1;
        count = item.supportCount;
        localStorage.setItem(`csrg_grp_resolutions_${groupId}`, JSON.stringify(list));
      }
    }
  } catch {
    // ignore
  }
  return count;
}

export async function updateGroupRoster(groupId: string, members: string, memberCount: string, subTeams?: any[]): Promise<any> {
  try {
    await supabase.from('Group').update({
      members,
      memberCount,
      ...(subTeams ? { subTeams } : {})
    }).eq('id', groupId);
  } catch (err) {
    console.warn('Failed to update group in supabase:', err);
  }
}

// ==========================================
// 3C. CITIZEN MINI-CAUCUS EVENTS & SCHEDULE
// ==========================================
export interface MiniCaucusEvent {
  id: string;
  wardId: string;
  wardName: string;
  county: string;
  groupName: string;
  groupId?: string;
  title: string;
  dateLabel: string;
  dateIso?: string;
  venue: string;
  agenda: string;
  status: 'UPCOMING_TOMORROW' | 'ACTIVE_TODAY' | 'UPCOMING' | 'CONCLUDED';
  isSpotlight: boolean;
  contactPhone?: string;
  facilitatorRole?: string;
  updatedAt: string;
}

export const DEFAULT_MINI_CAUCUSES: MiniCaucusEvent[] = [
  {
    id: 'caucus-sikhendu-sibembe',
    wardId: 'ward-7',
    wardName: 'Sikhendu',
    county: 'Trans Nzoia',
    groupName: 'Sibembe Group / Caucus',
    groupId: 'grp-sikhendu-sibembe',
    title: 'Sikhendu Ward Citizen Mini-Caucus (Sibembe Group)',
    dateLabel: 'Happening Tomorrow at 10:00 AM',
    dateIso: '2026-10-20T10:00:00',
    venue: 'Sibembe Community Center / Grounds, Sikhendu Ward',
    agenda: 'Grassroots wananchi deliberation ahead of the upcoming National Citizen Assembly on December 10, 2026. Consolidating community priorities on agroecology, smallholder seed sovereignty, rural feeder road maintenance, and adopting citizen resolutions.',
    status: 'UPCOMING_TOMORROW',
    isSpotlight: true,
    facilitatorRole: 'Irene Nyongesa (Sibembe Group Leader)',
    updatedAt: new Date().toISOString()
  }
];

export async function getMiniCaucuses(wardId?: string): Promise<MiniCaucusEvent[]> {
  try {
    const raw = localStorage.getItem('csrg_mini_caucuses_v1');
    if (raw) {
      const list: MiniCaucusEvent[] = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        const sibembeItem = list.find(
          c => c.id === 'caucus-sikhendu-sibembe' || 
               (c.wardName?.toLowerCase() === 'sikhendu' && c.groupName?.toLowerCase().includes('sibembe'))
        );
        if (sibembeItem) {
          sibembeItem.facilitatorRole = 'Irene Nyongesa (Sibembe Group Leader)';
        } else {
          list.unshift(DEFAULT_MINI_CAUCUSES[0]);
        }
        localStorage.setItem('csrg_mini_caucuses_v1', JSON.stringify(list));
        if (wardId) {
          return list.filter(c => c.wardId === wardId);
        }
        return list;
      }
    }
  } catch (e) {
    console.warn('Failed to load mini caucuses from storage:', e);
  }

  try {
    localStorage.setItem('csrg_mini_caucuses_v1', JSON.stringify(DEFAULT_MINI_CAUCUSES));
  } catch {}
  if (wardId) {
    return DEFAULT_MINI_CAUCUSES.filter(c => c.wardId === wardId);
  }
  return DEFAULT_MINI_CAUCUSES;
}

export async function saveMiniCaucus(caucus: Partial<MiniCaucusEvent> & { wardName: string; groupName: string }): Promise<MiniCaucusEvent> {
  const currentList = await getMiniCaucuses();
  const id = caucus.id || `caucus-${Date.now()}`;
  
  const newOrUpdated: MiniCaucusEvent = {
    id,
    wardId: caucus.wardId || 'ward-custom',
    wardName: caucus.wardName.trim(),
    county: caucus.county || 'Kenya',
    groupName: caucus.groupName.trim(),
    groupId: caucus.groupId,
    title: caucus.title?.trim() || `${caucus.wardName} Ward Citizen Mini-Caucus (${caucus.groupName})`,
    dateLabel: caucus.dateLabel?.trim() || 'Upcoming Session',
    dateIso: caucus.dateIso || new Date().toISOString(),
    venue: caucus.venue?.trim() || `${caucus.groupName} Grounds`,
    agenda: caucus.agenda?.trim() || 'Wananchi deliberation ahead of the National Citizen Assembly on December 10, 2026.',
    status: caucus.status || 'UPCOMING',
    isSpotlight: caucus.isSpotlight ?? true,
    contactPhone: caucus.contactPhone?.trim(),
    facilitatorRole: caucus.facilitatorRole?.trim() || 'Group Convener',
    updatedAt: new Date().toISOString()
  };

  let updatedList: MiniCaucusEvent[];
  if (newOrUpdated.isSpotlight) {
    updatedList = currentList.map(c => ({ ...c, isSpotlight: false }));
  } else {
    updatedList = [...currentList];
  }

  const existingIdx = updatedList.findIndex(c => c.id === id);
  if (existingIdx >= 0) {
    updatedList[existingIdx] = newOrUpdated;
  } else {
    updatedList.unshift(newOrUpdated);
  }

  try {
    localStorage.setItem('csrg_mini_caucuses_v1', JSON.stringify(updatedList));
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('csrg_minicaucuses_updated', { detail: newOrUpdated }));
  }

  return newOrUpdated;
}

export async function deleteMiniCaucus(id: string): Promise<void> {
  const currentList = await getMiniCaucuses();
  const filtered = currentList.filter(c => c.id !== id);
  try {
    localStorage.setItem('csrg_mini_caucuses_v1', JSON.stringify(filtered));
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('csrg_minicaucuses_updated'));
  }
}

// ==========================================
// 4. COMMITTEE SITTINGS & RESOLUTION TRACKING
// ==========================================
export interface CommitteeInfo {
  id: string;
  name: string;
  sector: string;
  convener: string;
  mandate: string;
}

export const CSRG_12_COMMITTEES: CommitteeInfo[] = [
  { id: 'com-1', name: 'Health, Sanitation & Nutrition Oversight Committee', sector: 'Health & Universal Care', convener: 'To be elected by Committee', mandate: 'Monitoring dispensary drug stockouts, maternal clinics, and community health promoters allowances.' },
  { id: 'com-2', name: 'Water, Environment & Agroecology Committee', sector: 'Natural Resources & Climate', convener: 'To be elected by Committee', mandate: 'Tracking borehole rehabilitation, piped water rationing, wetland conservation, and green manure adoption.' },
  { id: 'com-3', name: 'Roads, Feeder Bridges & Stormwater Drainage Committee', sector: 'Infrastructure & Public Works', convener: 'To be elected by Committee', mandate: 'Inspecting murram road grading, culvert desilting, pedestrian footbridges, and street lighting.' },
  { id: 'com-4', name: 'Youth, Gender, Disability & Social Justice Committee', sector: 'Social Development', convener: 'To be elected by Committee', mandate: 'Overseeing youth employment quotas, women enterprise access, disability assistive device budgets, and GBV safe spaces.' },
  { id: 'com-5', name: 'County Budget, CADP & Finance Oversight Committee', sector: 'Public Finance & Taxes', convener: 'To be elected by Committee', mandate: 'Scrutinizing County Annual Development Plans (CADP), revenue leakages, and participatory budgeting forums.' },
  { id: 'com-6', name: 'Agriculture, Livestock, Seed Sovereignty & Smallholder Farmers Committee', sector: 'Food Systems & Coops', convener: 'To be elected by Committee', mandate: 'Protecting indigenous seed banks, monitoring subsidized fertilizer distribution, and livestock disease dip tanks.' },
  { id: 'com-7', name: 'Early Childhood Education (ECDE) & Vocational Training Committee', sector: 'Education & Skills', convener: 'To be elected by Committee', mandate: 'Inspecting village polytechnics, ECDE teacher contracts, school feeding programs, and classroom facilities.' },
  { id: 'com-8', name: 'Trade, Open-Air Markets & Hustler Economy Committee', sector: 'Micro-Enterprises & Markets', convener: 'To be elected by Committee', mandate: 'Auditing market stall allocations, trader cess fees, fire safety in commercial zones, and water kiosks in markets.' },
  { id: 'com-9', name: 'Land Rights, Public Parks & Housing Protection Committee', sector: 'Land & Urban Planning', convener: 'To be elected by Committee', mandate: 'Investigating grabbing of public school grounds, recreation spaces, and defending informal settlement tenure.' },
  { id: 'com-10', name: 'Security, Public Lighting & Community Peacebuilding Committee', sector: 'Safety & Justice', convener: 'To be elected by Committee', mandate: 'Tracking solar high-mast streetlights, community policing forums, and conflict resolution in border wards.' },
  { id: 'com-11', name: 'Public Petitions, Ethics & County Executive Summons Committee', sector: 'Accountability & Petitions', convener: 'CSRG Secretariat Convener', mandate: 'Processing citizen petitions directly to County Executives, the Senate, and Ethics and Anti-Corruption Commission.' },
  { id: 'com-12', name: 'Devolution, Inter-Ward Solidarity & Cross-County Networking Committee', sector: 'Governance & Devolution', convener: 'To be elected by Committee', mandate: 'Facilitating cross-county farmer-to-farmer learning, inter-ward exchange visits, and national assembly delegations.' },
];

export interface CommitteeSitting {
  id: string;
  committeeId: string;
  committeeName: string;
  title: string;
  sittingDate: string;
  venue: string;
  agenda: string;
  status: 'UPCOMING' | 'CONCLUDED';
  outcomesAndFeedback?: string;
  resolutionsDiscussed: string[];
  reportDocUrl?: string;
  createdAt?: string;
}

const DEFAULT_SITTINGS: CommitteeSitting[] = [];

export interface ResolutionTrackerItem {
  id: string;
  resolutionText: string;
  wardName: string;
  passedAt: string;
  committeeAssigned: string;
  status: 'DELIBERATION' | 'EXECUTIVE_SUMMONED' | 'BUDGET_COMMITTED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'STALLED';
  officialFeedback: string;
  lastUpdated: string;
  citizenVerificationCount: number;
  createdAt?: string;
}

const DEFAULT_TRACKERS: ResolutionTrackerItem[] = [];

export async function getCommitteeSittings(): Promise<CommitteeSitting[]> {
  try {
    const { data, error } = await supabase.from('CommitteeSitting').select('*').order('sittingDate', { ascending: false });
    if (!error && data && data.length > 0) return filterMockItems(data);
  } catch (err) {
    // ignore
  }
  try {
    const raw = localStorage.getItem('csrg_committee_sittings_v1');
    return raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_SITTINGS;
  } catch {
    return DEFAULT_SITTINGS;
  }
}

export async function saveCommitteeSitting(sitting: Omit<CommitteeSitting, 'id' | 'createdAt'>): Promise<CommitteeSitting> {
  const newSitting: CommitteeSitting = {
    ...sitting,
    id: generateCleanId('sit'),
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('CommitteeSitting').insert([newSitting]);
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem('csrg_committee_sittings_v1');
    const current: CommitteeSitting[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_SITTINGS;
    localStorage.setItem('csrg_committee_sittings_v1', JSON.stringify([newSitting, ...current]));
  } catch {
    // ignore
  }

  return newSitting;
}

export async function getResolutionTrackers(): Promise<ResolutionTrackerItem[]> {
  try {
    const { data, error } = await supabase.from('ResolutionTracker').select('*').order('lastUpdated', { ascending: false });
    if (!error && data && data.length > 0) return filterMockItems(data);
  } catch (err) {
    // ignore
  }
  try {
    const raw = localStorage.getItem('csrg_resolution_trackers_v1');
    return raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_TRACKERS;
  } catch {
    return DEFAULT_TRACKERS;
  }
}

export async function saveResolutionTracker(tracker: Omit<ResolutionTrackerItem, 'id' | 'createdAt'>): Promise<ResolutionTrackerItem> {
  const newTracker: ResolutionTrackerItem = {
    ...tracker,
    id: generateCleanId('res-track'),
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('ResolutionTracker').insert([newTracker]);
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem('csrg_resolution_trackers_v1');
    const current: ResolutionTrackerItem[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_TRACKERS;
    localStorage.setItem('csrg_resolution_trackers_v1', JSON.stringify([newTracker, ...current]));
  } catch {
    // ignore
  }

  return newTracker;
}

// ==========================================
// 5. INDEPENDENT CANDIDATES PORTAL
// ==========================================
export interface IndependentCandidate {
  id: string;
  name: string;
  seat: 'MCA (Member of County Assembly)' | 'Member of Parliament (MP)' | 'County Governor' | 'Senator' | 'Woman Representative';
  county: string;
  wardOrConstituency: string;
  photoUrl: string;
  bio: string;
  priorities: string[];
  integrityPledgeSigned: boolean;
  pledgeDate: string;
  communityEndorsements: string[];
  contactEmail?: string;
  contactPhone?: string;
  verifiedCitizenStatus: boolean;
  createdAt?: string;
}

const DEFAULT_CANDIDATES: IndependentCandidate[] = [];

export async function getIndependentCandidates(county?: string): Promise<IndependentCandidate[]> {
  try {
    let query = supabase.from('IndependentCandidate').select('*');
    if (county) {
      query = query.eq('county', county);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) return filterMockItems(data);
  } catch (err) {
    // ignore
  }

  try {
    const raw = localStorage.getItem('csrg_candidates_v1');
    const list: IndependentCandidate[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_CANDIDATES;
    if (county) {
      return list.filter(c => c.county.toLowerCase() === county.toLowerCase());
    }
    return list;
  } catch {
    return DEFAULT_CANDIDATES;
  }
}

export async function saveIndependentCandidate(candidate: Omit<IndependentCandidate, 'id' | 'verifiedCitizenStatus' | 'createdAt'>): Promise<IndependentCandidate> {
  const newCand: IndependentCandidate = {
    ...candidate,
    id: generateCleanId('cand'),
    verifiedCitizenStatus: true,
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('IndependentCandidate').insert([newCand]);
  } catch (err) {
    console.warn('Failed to insert IndependentCandidate to Supabase, saving locally:', err);
  }

  try {
    const raw = localStorage.getItem('csrg_candidates_v1');
    const current: IndependentCandidate[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_CANDIDATES;
    localStorage.setItem('csrg_candidates_v1', JSON.stringify([newCand, ...current]));
  } catch {
    // ignore
  }

  return newCand;
}

// ==========================================
// 6. NATIONAL CITIZEN ACTIVITIES & BULLETINS
// ==========================================
export interface NationalActivity {
  id: string;
  title: string;
  category: 'National Assembly' | 'Public Hearing Mobilization' | 'Peasant Caravan' | 'Youth Bunge Summit' | 'Budget Audit';
  dateRange: string;
  location: string;
  description: string;
  targetCounties: string;
  howToParticipate: string;
  organizer: string;
  isUrgent?: boolean;
  createdAt?: string;
}

const DEFAULT_NATIONAL_ACTIVITIES: NationalActivity[] = [];

export async function getNationalActivities(): Promise<NationalActivity[]> {
  try {
    const { data, error } = await supabase.from('NationalActivity').select('*');
    if (!error && data && data.length > 0) return filterMockItems(data);
  } catch (err) {
    // ignore
  }

  try {
    const raw = localStorage.getItem('csrg_national_activities_v1');
    return raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_NATIONAL_ACTIVITIES;
  } catch {
    return DEFAULT_NATIONAL_ACTIVITIES;
  }
}

export async function saveNationalActivity(act: Omit<NationalActivity, 'id' | 'createdAt'>): Promise<NationalActivity> {
  const newAct: NationalActivity = {
    ...act,
    id: generateCleanId('nat'),
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('NationalActivity').insert([newAct]);
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem('csrg_national_activities_v1');
    const current: NationalActivity[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_NATIONAL_ACTIVITIES;
    localStorage.setItem('csrg_national_activities_v1', JSON.stringify([newAct, ...current]));
  } catch {
    // ignore
  }

  return newAct;
}

// ==========================================
// 7. PAST ASSEMBLY ARCHIVES & PROCEEDINGS
// ==========================================
export interface PastAssemblyArchive {
  id: string;
  title: string;
  assemblyType: 'National Citizen Assembly' | 'Ward Citizen Assembly';
  wardOrLevel: string;
  sessionDate: string;
  presidingConvener: string;
  attendanceCount: number;
  videoUrl?: string;
  audioUrl?: string;
  resolutionsSummary: string;
  minutesDocUrl?: string;
  resolutionsCount: number;
  keyResolutions: string[];
  createdAt?: string;
}

const DEFAULT_ARCHIVES: PastAssemblyArchive[] = [];

export async function getPastAssemblyArchives(): Promise<PastAssemblyArchive[]> {
  try {
    const { data, error } = await supabase.from('PastAssemblyArchive').select('*').order('sessionDate', { ascending: false });
    if (!error && data && data.length > 0) return filterMockItems(data);
  } catch (err) {
    // ignore
  }

  try {
    const raw = localStorage.getItem('csrg_past_assemblies_v1');
    return raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_ARCHIVES;
  } catch {
    return DEFAULT_ARCHIVES;
  }
}

export async function savePastAssemblyArchive(archive: Omit<PastAssemblyArchive, 'id' | 'createdAt'>): Promise<PastAssemblyArchive> {
  const newArchive: PastAssemblyArchive = {
    ...archive,
    id: generateCleanId('arch'),
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('PastAssemblyArchive').insert([newArchive]);
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem('csrg_past_assemblies_v1');
    const current: PastAssemblyArchive[] = raw ? filterMockItems(JSON.parse(raw)) : DEFAULT_ARCHIVES;
    localStorage.setItem('csrg_past_assemblies_v1', JSON.stringify([newArchive, ...current]));
  } catch {
    // ignore
  }

  return newArchive;
}

// ==========================================
// 8. WARD LEVEL RESOLUTIONS & DOCUMENTS
// ==========================================
export interface WardResolutionDoc {
  id: string;
  wardId: string;
  wardName?: string;
  county?: string;
  title: string;
  category: string;
  documentDate: string;
  summary?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  fileUrl?: string;
  isPinned: boolean;
  uploadedBy?: string;
  createdAt: string;
}

export async function getWardResolutions(wardId?: string): Promise<WardResolutionDoc[]> {
  try {
    let query = supabase
      .from('AssemblyDocument')
      .select('*')
      .order('isPinned', { ascending: false })
      .order('documentDate', { ascending: false });
      
    if (wardId) {
      query = query.eq('wardId', wardId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return filterMockItems(data);
    }
  } catch (err) {
    console.warn('Failed to fetch AssemblyDocument from Supabase:', err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem('csrg_mock_db_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      const list = parsed.AssemblyDocument || [];
      const cleanList = filterMockItems<WardResolutionDoc>(list);
      if (wardId) {
        return cleanList.filter((d) => d.wardId === wardId);
      }
      return cleanList;
    }
  } catch {
    // ignore
  }

  return [];
}

export async function saveWardResolution(doc: Omit<WardResolutionDoc, 'id' | 'createdAt'>): Promise<WardResolutionDoc> {
  let resolvedWardName = doc.wardName;
  let resolvedCounty = doc.county;

  if (!resolvedWardName && doc.wardId) {
    try {
      const raw = localStorage.getItem('csrg_mock_db_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        const w = (parsed.Ward || []).find((it: any) => it.id === doc.wardId || it.slug === doc.wardId);
        if (w) {
          resolvedWardName = w.name;
          resolvedCounty = w.county || (w.description ? w.description.split('-')[0]?.trim() : '');
        }
      }
    } catch {
      // ignore
    }
  }

  const newDoc: WardResolutionDoc = {
    ...doc,
    wardName: resolvedWardName || doc.wardName || 'Ward',
    county: resolvedCounty || doc.county || 'Kenya',
    id: generateCleanId('doc'),
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('AssemblyDocument').insert([newDoc]);
  } catch (err) {
    console.warn('Failed to save AssemblyDocument to Supabase:', err);
  }

  try {
    const raw = localStorage.getItem('csrg_mock_db_v1');
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.AssemblyDocument = [newDoc, ...(parsed.AssemblyDocument || [])];
    localStorage.setItem('csrg_mock_db_v1', JSON.stringify(parsed));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  } catch {
    // ignore
  }

  return newDoc;
}

export async function deleteWardResolution(id: string): Promise<void> {
  try {
    await supabase.from('AssemblyDocument').delete().eq('id', id);
  } catch {
    // ignore
  }
  try {
    const raw = localStorage.getItem('csrg_mock_db_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.AssemblyDocument) {
        parsed.AssemblyDocument = parsed.AssemblyDocument.filter((d: any) => d.id !== id);
        localStorage.setItem('csrg_mock_db_v1', JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore
  }
}
