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
  'arch-1', 'arch-2', 'arch-3',
  'gres-sibembe-1', 'gres-sibembe-2',
  'gissue-sibembe-1', 'gissue-sibembe-2', 'gissue-sibembe-3'
]);

export function filterMockItems<T extends { id: string; title?: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter(item => {
    if (MOCK_IDS.has(item.id)) return false;
    if (typeof item.id === 'string' && (item.id.startsWith('gres-') && item.id.endsWith('-1'))) return false;
    if (typeof item.id === 'string' && (item.id.startsWith('gissue-') && item.id.endsWith('-1'))) return false;
    if (typeof item.id === 'string' && (item.id.startsWith('act-') && item.id.endsWith('-1'))) return false;
    if (item.title && typeof item.title === 'string') {
      const lower = item.title.toLowerCase();
      if (
        lower.includes('mandate for the december 10 national citizen assembly') ||
        lower.includes('resolution 01/sik/2026') ||
        lower.includes('resolution 01/2026') ||
        lower.includes('resolution 01/shi/2026') ||
        lower.includes('mini-caucus priority: protecting community natural resources') ||
        lower.includes('pre-assembly grassroots mobilization & deliberation sitting')
      ) {
        return false;
      }
    }
    return true;
  });
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
  status: 'DELIBERATING' | 'DELIBERATED' | 'PASSED_MOTION' | 'ADOPTED_RESOLUTION' | 'ESCALATED_TO_ASSEMBLY' | 'RESOLVED' | 'PROPOSED';
  certifiedBy?: string;
  passedAt?: string;
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
  fileUrl?: string;
  fileName?: string;
  isPinned?: boolean;
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

export async function updateGroupWallIssueStatus(
  id: string, 
  groupId: string, 
  status: GroupWallIssue['status'], 
  certifiedBy?: string
): Promise<GroupWallIssue | null> {
  try {
    const raw = localStorage.getItem(`csrg_grp_issues_${groupId}`);
    if (raw) {
      const list: GroupWallIssue[] = JSON.parse(raw);
      const item = list.find(it => it.id === id);
      if (item) {
        item.status = status;
        if (certifiedBy) item.certifiedBy = certifiedBy;
        if (status === 'PASSED_MOTION' || status === 'ADOPTED_RESOLUTION') {
          item.passedAt = new Date().toISOString();

          // Mirror into csrg_mock_db_v1.Resolution so it reflects across the whole site
          try {
            const dbRaw = localStorage.getItem('csrg_mock_db_v1');
            if (dbRaw) {
              const db = JSON.parse(dbRaw);
              if (!Array.isArray(db.Resolution)) db.Resolution = [];
              const existingRes = db.Resolution.find((r: any) => r.id === `res-${item.id}`);
              const resData = {
                id: `res-${item.id}`,
                title: `${status === 'PASSED_MOTION' ? 'Passed Motion' : 'Adopted Resolution'}: ${item.title}`,
                description: `${item.description} | Solution: ${item.proposedSolution || 'Deliberated in Citizen Mini-Caucus'}`,
                wardId: item.wardId || 'ward-7',
                wardName: item.wardName || 'Sikhendu',
                groupName: item.groupName || 'Sibembe Food Coop',
                status: 'PASSED',
                certifiedBy: item.certifiedBy || 'Irene Nyongesa',
                certifiedRole: 'Coop Leader & Convener',
                votesFor: (item.votes || 1) + 20,
                votesAgainst: 0,
                createdAt: item.passedAt
              };
              if (existingRes) {
                Object.assign(existingRes, resData);
              } else {
                db.Resolution.unshift(resData);
              }
              localStorage.setItem('csrg_mock_db_v1', JSON.stringify(db));
            }
          } catch (mErr) {
            console.warn('Failed to mirror issue to resolutions:', mErr);
          }
        }
        localStorage.setItem(`csrg_grp_issues_${groupId}`, JSON.stringify(list));
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('csrg_issues_updated', { detail: { id, groupId, status } }));
          window.dispatchEvent(new Event('storage'));
        }
        return item;
      }
    }
  } catch (e) {
    console.warn('Failed to update issue status:', e);
  }
  return null;
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
    resolutionNumber: `RES-${(res.wardName || 'SHI').slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
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

  // Mirror across site into csrg_mock_db_v1.Resolution and AssemblyDocument so it shows on WardPage resolutions, Homepage resolutions, and National Assembly
  try {
    const dbRaw = localStorage.getItem('csrg_mock_db_v1');
    if (dbRaw) {
      const db = JSON.parse(dbRaw);
      if (!Array.isArray(db.Resolution)) db.Resolution = [];
      db.Resolution.unshift({
        id: newRes.id,
        title: newRes.title,
        description: `${newRes.summary} | Key actions: ${newRes.actionPoints?.join('; ') || 'Adopted by consensus'}`,
        wardId: newRes.wardId,
        wardName: newRes.wardName,
        groupName: newRes.groupName,
        status: 'PASSED',
        certifiedBy: newRes.certifiedBy,
        certifiedRole: newRes.certifiedRole,
        votesFor: newRes.supportCount + 28,
        votesAgainst: 0,
        createdAt: newRes.createdAt
      });

      if (!Array.isArray(db.AssemblyDocument)) db.AssemblyDocument = [];
      const alreadyHasDoc = db.AssemblyDocument.some((d: any) => d.id === `doc-${newRes.id}` || d.title === newRes.title);
      if (!alreadyHasDoc) {
        const docItem = {
          id: `doc-${newRes.id}`,
          wardId: newRes.wardId,
          wardName: newRes.wardName || 'Ward',
          county: 'Trans Nzoia',
          title: newRes.title,
          category: 'Assembly Resolutions',
          documentDate: newRes.createdAt ? newRes.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          summary: `${newRes.summary || ''}\n\nAction Points:\n${(newRes.actionPoints || []).map(p => `• ${p}`).join('\n')}`,
          fileName: `${newRes.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          fileSize: '1.4 MB',
          fileType: 'PDF Document (Adopted Resolution)',
          fileUrl: newRes.fileUrl,
          isPinned: true,
          uploadedBy: `${newRes.certifiedBy} (${newRes.certifiedRole || 'Convener'})`,
          createdAt: newRes.createdAt
        };
        db.AssemblyDocument.unshift(docItem);
        try {
          supabase.from('AssemblyDocument').insert([docItem]);
        } catch {}
      }

      localStorage.setItem('csrg_mock_db_v1', JSON.stringify(db));
    }
  } catch (e) {
    console.warn('Failed to mirror resolution into mock DB:', e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('csrg_resolutions_updated', { detail: newRes }));
    window.dispatchEvent(new Event('storage'));
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

export async function togglePinGroupWallResolution(id: string, groupId: string): Promise<boolean> {
  let isPinned = false;
  try {
    const raw = localStorage.getItem(`csrg_grp_resolutions_${groupId}`);
    if (raw) {
      const list: GroupWallResolution[] = JSON.parse(raw);
      const item = list.find(it => it.id === id);
      if (item) {
        item.isPinned = !item.isPinned;
        isPinned = item.isPinned;
        localStorage.setItem(`csrg_grp_resolutions_${groupId}`, JSON.stringify(list));
      }
    }
  } catch {
    // ignore
  }

  // Also update in AssemblyDocument if mirrored
  try {
    const dbRaw = localStorage.getItem('csrg_mock_db_v1');
    if (dbRaw) {
      const db = JSON.parse(dbRaw);
      if (Array.isArray(db.AssemblyDocument)) {
        const doc = db.AssemblyDocument.find((d: any) => d.id === `doc-${id}` || d.id === id);
        if (doc) {
          doc.isPinned = isPinned;
        }
        localStorage.setItem('csrg_mock_db_v1', JSON.stringify(db));
      }
    }
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('csrg_resolutions_updated'));
    window.dispatchEvent(new Event('storage'));
  }

  return isPinned;
}

export async function deleteGroupWallResolution(id: string, groupId: string): Promise<boolean> {
  try {
    await supabase.from('GroupResolution').delete().eq('id', id);
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(`csrg_grp_resolutions_${groupId}`);
    if (raw) {
      const list: GroupWallResolution[] = JSON.parse(raw);
      const filtered = list.filter(r => r.id !== id);
      localStorage.setItem(`csrg_grp_resolutions_${groupId}`, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  // Also remove from csrg_mock_db_v1 (Resolution and AssemblyDocument) so mirrored copies disappear across the site
  try {
    const dbRaw = localStorage.getItem('csrg_mock_db_v1');
    if (dbRaw) {
      const db = JSON.parse(dbRaw);
      if (Array.isArray(db.Resolution)) {
        db.Resolution = db.Resolution.filter((r: any) => r.id !== id && r.id !== `res-${id}`);
      }
      if (Array.isArray(db.AssemblyDocument)) {
        db.AssemblyDocument = db.AssemblyDocument.filter((d: any) => d.id !== id && d.id !== `doc-${id}`);
      }
      localStorage.setItem('csrg_mock_db_v1', JSON.stringify(db));
    }
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('csrg_resolutions_updated', { detail: { id, deleted: true } }));
    window.dispatchEvent(new Event('storage'));
  }

  return true;
}

export async function deleteGroupWallIssue(id: string, groupId: string): Promise<boolean> {
  try {
    await supabase.from('GroupIssue').delete().eq('id', id);
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(`csrg_grp_issues_${groupId}`);
    if (raw) {
      const list: GroupWallIssue[] = JSON.parse(raw);
      const filtered = list.filter(i => i.id !== id);
      localStorage.setItem(`csrg_grp_issues_${groupId}`, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  // Also remove any mirrored resolution if this issue was elevated
  try {
    const dbRaw = localStorage.getItem('csrg_mock_db_v1');
    if (dbRaw) {
      const db = JSON.parse(dbRaw);
      if (Array.isArray(db.Resolution)) {
        db.Resolution = db.Resolution.filter((r: any) => r.id !== `res-${id}`);
      }
      localStorage.setItem('csrg_mock_db_v1', JSON.stringify(db));
    }
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('csrg_issues_updated', { detail: { id, deleted: true } }));
    window.dispatchEvent(new Event('storage'));
  }

  return true;
}

export async function deleteGroupActivity(id: string, groupId?: string): Promise<boolean> {
  try {
    await supabase.from('GroupActivity').delete().eq('id', id);
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem('csrg_group_activities_v1');
    if (raw) {
      const list: GroupActivity[] = JSON.parse(raw);
      const filtered = list.filter(a => a.id !== id);
      localStorage.setItem('csrg_group_activities_v1', JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
  }

  return true;
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
    id: 'caucus-kangemi',
    wardId: 'ward-kangemi',
    wardName: 'Kangemi',
    county: 'Nairobi',
    groupName: 'Kangemi + New Kangemi',
    groupId: 'grp-kangemi-grassroots',
    title: 'Kangemi + New Kangemi Citizen Mini-Caucus',
    dateLabel: 'Saturday, 24th October 2026',
    dateIso: '2026-10-24T10:00:00',
    venue: 'Kangemi, Nairobi',
    agenda: 'Grassroots citizen deliberation ahead of the December 10 National Citizen Assembly.',
    status: 'UPCOMING',
    isSpotlight: true,
    facilitatorRole: 'Kangemi Citizen Assembly Conveners',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'caucus-lumakanda-blessed-mothers',
    wardId: 'ward-lumakanda',
    wardName: 'Lumakanda',
    county: 'Kakamega',
    groupName: 'Blessed Mothers Widows',
    groupId: 'grp-lumakanda-blessed-mothers',
    title: 'Blessed Mothers Widows Citizen Mini-Caucus',
    dateLabel: 'Thursday, 29th October 2026',
    dateIso: '2026-10-29T10:00:00',
    venue: 'Lumakanda, Lugari',
    agenda: 'Grassroots citizen deliberation ahead of the December 10 National Citizen Assembly.',
    status: 'UPCOMING',
    isSpotlight: false,
    facilitatorRole: 'Blessed Mothers Widows Leadership',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'caucus-karura-redhill',
    wardId: 'ward-karura',
    wardName: 'Karura',
    county: 'Nairobi',
    groupName: 'Redhill Karura Residents Association',
    groupId: 'grp-redhill-karura',
    title: 'Redhill Karura Residents Association Citizen Mini-Caucus',
    dateLabel: 'Saturday, 31st October 2026',
    dateIso: '2026-10-31T09:30:00',
    venue: 'Karura, Nairobi',
    agenda: 'Grassroots citizen deliberation ahead of the December 10 National Citizen Assembly.',
    status: 'UPCOMING',
    isSpotlight: false,
    facilitatorRole: 'Redhill Karura Executive Committee',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'caucus-siaya-apuoyo',
    wardId: 'ward-central-alego',
    wardName: 'Central Alego',
    county: 'Siaya',
    groupName: 'Apuoyo',
    groupId: 'grp-siaya-apuoyo',
    title: 'Apuoyo Citizen Mini-Caucus',
    dateLabel: 'Monday, 2nd November 2026',
    dateIso: '2026-11-02T10:00:00',
    venue: 'Apuoyo, Siaya',
    agenda: 'Grassroots citizen deliberation ahead of the December 10 National Citizen Assembly.',
    status: 'UPCOMING',
    isSpotlight: false,
    facilitatorRole: 'Apuoyo Peasant & Farmers Convener',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'caucus-nairobi-upendo-hope',
    wardId: 'ward-nairobi-central',
    wardName: 'Nairobi Central',
    county: 'Nairobi',
    groupName: 'Upendo + Hope + Kina Mama',
    groupId: 'grp-upendo-hope-kinamama',
    title: 'Upendo + Hope + Kina Mama Citizen Mini-Caucus',
    dateLabel: 'Sunday, 8th November 2026',
    dateIso: '2026-11-08T14:00:00',
    venue: 'Nairobi',
    agenda: 'Grassroots citizen deliberation ahead of the December 10 National Citizen Assembly.',
    status: 'UPCOMING',
    isSpotlight: false,
    facilitatorRole: 'Kina Mama Grassroots Alliance',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'caucus-siaya-ndere',
    wardId: 'ward-west-alego',
    wardName: 'West Alego',
    county: 'Siaya',
    groupName: 'Ndere',
    groupId: 'grp-siaya-ndere',
    title: 'Ndere Citizen Mini-Caucus',
    dateLabel: 'Sunday, 15th November 2026',
    dateIso: '2026-11-15T10:00:00',
    venue: 'Ndere, Siaya',
    agenda: 'Grassroots citizen deliberation ahead of the December 10 National Citizen Assembly.',
    status: 'UPCOMING',
    isSpotlight: false,
    facilitatorRole: 'Ndere Citizen Caucus Convener',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'caucus-kuria-angaza',
    wardId: 'ward-bukira-east',
    wardName: 'Bukira East',
    county: 'Migori (Kuria)',
    groupName: 'Angaza + Nyamagagana',
    groupId: 'grp-kuria-angaza-nyamagagana',
    title: 'Angaza + Nyamagagana Citizen Mini-Caucus',
    dateLabel: 'Thursday, 5th November 2026',
    dateIso: '2026-11-05T10:00:00',
    venue: 'Kuria, Migori',
    agenda: 'Grassroots citizen deliberation ahead of the December 10 National Citizen Assembly.',
    status: 'UPCOMING',
    isSpotlight: false,
    facilitatorRole: 'Angaza Kuria Community Committee',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'caucus-lumakanda-kona-mmbaya',
    wardId: 'ward-lumakanda',
    wardName: 'Lumakanda',
    county: 'Kakamega',
    groupName: 'Kona Mmbaya + Friends Without Borders',
    groupId: 'grp-kona-mmbaya-fwb',
    title: 'Kona Mmbaya + Friends Without Borders Citizen Mini-Caucus',
    dateLabel: 'Monday, 9th November 2026',
    dateIso: '2026-11-09T10:00:00',
    venue: 'Lumakanda, Kakamega',
    agenda: 'Grassroots citizen deliberation ahead of the December 10 National Citizen Assembly.',
    status: 'UPCOMING',
    isSpotlight: false,
    facilitatorRole: 'Friends Without Borders Convener',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'caucus-migori-mariwa-mulo-utoma',
    wardId: 'ward-south-sakwa',
    wardName: 'South Sakwa',
    county: 'Migori',
    groupName: 'Mariwa, Utoma Widows, and Mulo',
    groupId: 'grp-mariwa-mulo-utoma',
    title: 'Mariwa, Utoma Widows, and Mulo Citizen Mini-Caucus',
    dateLabel: 'Tuesday, 10th November 2026',
    dateIso: '2026-11-10T10:00:00',
    venue: 'South Sakwa Ward, Migori',
    agenda: 'Grassroots citizen deliberation ahead of the December 10 National Citizen Assembly.',
    status: 'UPCOMING',
    isSpotlight: false,
    facilitatorRole: 'South Sakwa Joint Community Conveners',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'caucus-baringo-kabarnet',
    wardId: 'ward-kabarnet',
    wardName: 'Kabarnet',
    county: 'Baringo',
    groupName: 'Kabarnet',
    groupId: 'grp-baringo-kabarnet',
    title: 'Kabarnet Citizen Mini-Caucus',
    dateLabel: 'Wednesday, 11th November 2026',
    dateIso: '2026-11-11T10:00:00',
    venue: 'Kabarnet, Baringo',
    agenda: 'Grassroots citizen deliberation ahead of the December 10 National Citizen Assembly.',
    status: 'UPCOMING',
    isSpotlight: false,
    facilitatorRole: 'Kabarnet Civic Action Team',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'caucus-sikhendu-sibembe',
    wardId: 'ward-7',
    wardName: 'Sikhendu',
    county: 'Trans Nzoia',
    groupName: 'Sibembe Food Coop',
    groupId: 'grp-sikhendu-sibembe',
    title: 'Sikhendu Ward Citizen Mini-Caucus (Sibembe Food Coop)',
    dateLabel: 'Tuesday, 20th October 2026',
    dateIso: '2026-10-20T10:00:00',
    venue: 'Sikhendu, Trans Nzoia',
    agenda: 'Grassroots citizen deliberation ahead of the December 10 National Citizen Assembly.',
    status: 'CONCLUDED',
    isSpotlight: false,
    facilitatorRole: 'Irene Nyongesa (Sibembe Food Coop Leader)',
    updatedAt: new Date().toISOString()
  }
];

export async function getMiniCaucuses(wardId?: string): Promise<MiniCaucusEvent[]> {
  try {
    const raw = localStorage.getItem('csrg_mini_caucuses_v2') || localStorage.getItem('csrg_mini_caucuses_v1');
    if (raw) {
      let list: MiniCaucusEvent[] = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        // Ensure all DEFAULT_MINI_CAUCUSES exist in the list
        for (const defaultCaucus of DEFAULT_MINI_CAUCUSES) {
          const existing = list.find(c => c.id === defaultCaucus.id);
          if (!existing) {
            list.push(defaultCaucus);
          }
        }
        
        // Ensure November dates and UPCOMING status for the 4 caucuses, South Sakwa Ward for Mariwa, clean times, and update sibembe
        for (const c of list) {
          if (c.id === 'caucus-kuria-angaza' || c.title?.toLowerCase().includes('angaza')) {
            c.dateLabel = 'Thursday, 5th November 2026';
            c.dateIso = '2026-11-05T10:00:00';
            c.status = 'UPCOMING';
          }
          if (c.id === 'caucus-lumakanda-kona-mmbaya' || c.title?.toLowerCase().includes('kona mmbaya')) {
            c.dateLabel = 'Monday, 9th November 2026';
            c.dateIso = '2026-11-09T10:00:00';
            c.status = 'UPCOMING';
          }
          if (c.id === 'caucus-migori-mariwa-mulo-utoma' || c.groupName?.toLowerCase().includes('mariwa') || c.title?.toLowerCase().includes('mariwa')) {
            c.wardName = 'South Sakwa';
            c.wardId = 'ward-south-sakwa';
            c.county = 'Migori';
            c.groupName = 'Mariwa, Utoma Widows, and Mulo';
            c.title = 'Mariwa, Utoma Widows, and Mulo Citizen Mini-Caucus';
            c.dateLabel = 'Tuesday, 10th November 2026';
            c.dateIso = '2026-11-10T10:00:00';
            c.status = 'UPCOMING';
          }
          if (c.id === 'caucus-baringo-kabarnet' || c.title?.toLowerCase().includes('kabarnet')) {
            c.dateLabel = 'Wednesday, 11th November 2026';
            c.dateIso = '2026-11-11T10:00:00';
            c.status = 'UPCOMING';
          }
          if (c.id === 'caucus-sikhendu-sibembe' || c.groupName?.toLowerCase().includes('sibembe')) {
            c.isSpotlight = false;
            c.status = 'CONCLUDED';
          }
          // Strip any time in parentheses from dateLabel
          if (c.dateLabel && c.dateLabel.includes('(')) {
            c.dateLabel = c.dateLabel.split('(')[0].trim();
          }
        }

        // Sort upcoming caucuses first
        list.sort((a, b) => {
          if (a.status === 'UPCOMING' && b.status !== 'UPCOMING') return -1;
          if (a.status !== 'UPCOMING' && b.status === 'UPCOMING') return 1;
          return 0;
        });

        localStorage.setItem('csrg_mini_caucuses_v2', JSON.stringify(list));
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
    localStorage.setItem('csrg_mini_caucuses_v2', JSON.stringify(DEFAULT_MINI_CAUCUSES));
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
    localStorage.setItem('csrg_mini_caucuses_v2', JSON.stringify(updatedList));
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
    localStorage.setItem('csrg_mini_caucuses_v2', JSON.stringify(filtered));
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
  let allDocs: WardResolutionDoc[] = [];

  try {
    const { data, error } = await supabase
      .from('AssemblyDocument')
      .select('*')
      .order('isPinned', { ascending: false })
      .order('documentDate', { ascending: false });
      
    if (!error && data && data.length > 0) {
      allDocs = filterMockItems<WardResolutionDoc>(data);
    }
  } catch (err) {
    console.warn('Failed to fetch AssemblyDocument from Supabase:', err);
  }

  // Fallback / merge with localStorage
  try {
    const raw = localStorage.getItem('csrg_mock_db_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      const localDocs = filterMockItems<WardResolutionDoc>(parsed.AssemblyDocument || []);
      
      // Combine and deduplicate by id/title
      const existingIds = new Set(allDocs.map(d => d.id));
      for (const doc of localDocs) {
        if (!existingIds.has(doc.id)) {
          allDocs.push(doc);
          existingIds.add(doc.id);
        }
      }

      // Also incorporate any ratified Resolution items that are not yet in AssemblyDocument
      if (Array.isArray(parsed.Resolution)) {
        for (const res of parsed.Resolution) {
          const docEquivalentId = `doc-${res.id}`;
          const alreadyIncluded = allDocs.some(d => d.id === res.id || d.id === docEquivalentId || d.title === res.title);
          if (!alreadyIncluded) {
            allDocs.push({
              id: docEquivalentId,
              wardId: res.wardId || 'ward-7',
              wardName: res.wardName || 'Sikhendu',
              county: 'Trans Nzoia',
              title: res.title,
              category: 'Assembly Resolutions',
              documentDate: res.createdAt ? res.createdAt.split('T')[0] : '2026-10-20',
              summary: res.description || 'Adopted unanimous resolution by consensus.',
              fileName: `${res.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
              fileSize: '1.4 MB',
              fileType: 'PDF Document (Certified)',
              isPinned: true,
              uploadedBy: res.certifiedBy ? `${res.certifiedBy} (${res.certifiedRole || 'Convener'})` : 'Ward Secretariat',
              createdAt: res.createdAt || new Date().toISOString()
            });
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // Normalize author / uploadedBy fields
  for (const d of allDocs) {
    if (!d.uploadedBy && (d as any).officerName) {
      d.uploadedBy = (d as any).officerName;
    }
  }

  // Filter by ward if requested
  if (wardId) {
    const cleanFilter = wardId.trim().toLowerCase();
    allDocs = allDocs.filter(doc => {
      const dWardId = (doc.wardId || '').toLowerCase();
      const dWardName = (doc.wardName || '').toLowerCase();
      const dTitle = (doc.title || '').toLowerCase();

      if (dWardId === cleanFilter) return true;
      if (dWardName === cleanFilter) return true;

      // Sikhendu alias matching
      if (cleanFilter === 'ward-7' || cleanFilter === 'sikhendu' || cleanFilter === 'shikendu') {
        return dWardId === 'ward-7' || dWardId === 'sikhendu' || dWardName.includes('sikhendu') || dTitle.includes('sibembe');
      }

      return false;
    });
  }

  // Sort pinned first, then by documentDate descending
  return allDocs.sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    const dateA = a.documentDate || a.createdAt || '';
    const dateB = b.documentDate || b.createdAt || '';
    return dateB.localeCompare(dateA);
  });
}

export async function saveWardResolution(doc: Omit<WardResolutionDoc, 'id' | 'createdAt'>): Promise<WardResolutionDoc> {
  let resolvedWardName = doc.wardName;
  let resolvedCounty = doc.county;

  if ((!resolvedWardName || resolvedWardName === 'Ward') && doc.wardId) {
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
    if (!Array.isArray(parsed.AssemblyDocument)) parsed.AssemblyDocument = [];
    parsed.AssemblyDocument = [newDoc, ...parsed.AssemblyDocument.filter((d: any) => d.id !== newDoc.id)];

    // Also mirror to Resolution table so National Assembly and Discussion feeds can see it
    if (!Array.isArray(parsed.Resolution)) parsed.Resolution = [];
    parsed.Resolution.unshift({
      id: `res-${newDoc.id}`,
      title: newDoc.title,
      description: newDoc.summary || 'Adopted official ward assembly resolution.',
      wardId: newDoc.wardId,
      wardName: newDoc.wardName,
      status: 'PASSED',
      certifiedBy: newDoc.uploadedBy || 'Ward Clerk',
      votesFor: 38,
      votesAgainst: 0,
      createdAt: newDoc.createdAt
    });

    localStorage.setItem('csrg_mock_db_v1', JSON.stringify(parsed));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('csrg_resolutions_updated', { detail: newDoc }));
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
