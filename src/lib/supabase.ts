import { createClient } from '@supabase/supabase-js';

// Verify whether a given string is a valid HTTP/HTTPS URL and not a dummy placeholder
function isValidHttpUrl(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (
    !trimmed ||
    trimmed === 'your-supabase-url' ||
    trimmed.startsWith('your-') ||
    trimmed.includes('example.com')
  ) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidKey(key?: string | null): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return (
    trimmed.length > 20 &&
    !trimmed.includes('your-supabase-anon-key') &&
    !trimmed.startsWith('your-')
  );
}

const rawEnvUrl =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_SUPABASE_URL
    : typeof process !== 'undefined' && process.env
      ? process.env.VITE_SUPABASE_URL
      : undefined;

const rawEnvKey =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : typeof process !== 'undefined' && process.env
      ? process.env.VITE_SUPABASE_ANON_KEY
      : undefined;

// Only use real Supabase if both URL and Key are genuinely valid
const isRealConfigProvided = isValidHttpUrl(rawEnvUrl) && isValidKey(rawEnvKey);

// ==========================================
// In-Memory & LocalStorage Mock Database
// ==========================================
const DB_STORAGE_KEY = 'csrg_mock_db_v1';

interface MockDB {
  Ward: any[];
  User: any[];
  Issue: any[];
  Discussion: any[];
  Group: any[];
  Resolution: any[];
  AssemblyDocument: any[];
}

function createDefaultGroupsForWard(w: { id: string; name: string }) {
  const list = [
    {
      id: `grp-${w.id}-1`,
      name: `${w.name} Agroecology & Smallholder Farmers Cooperative`,
      wardId: w.id,
      category: 'Agroecology & Kitchen Gardens',
      description: `Mobilizing smallholder peasant farmers, organic compost builders, and indigenous seed guardians across ${w.name} Ward. Holding weekly mini-caucuses to draft agroecology resolutions for the upcoming National Citizen Assembly on December 10, 2026.`,
      leaderName: '',
      leaderRole: 'Cooperative Chairperson',
      leaderPhone: '',
      meetingDay: 'Every Saturday at 2:00 PM',
      meetingFrequency: 'Weekly Mini-Caucus',
      memberCount: '0',
      members: '',
      subTeams: []
    },
    {
      id: `grp-${w.id}-2`,
      name: `${w.name} Youth Civic Action & Bunge La Wananchi`,
      wardId: w.id,
      category: 'Citizen Caucus Meeting',
      description: `Grassroots youth bunge monitoring Ward Development Funds (WDF), public dispensaries, and bursary allocations in ${w.name}. Leading youth citizen assemblies and drafting youth empowerment petitions for the December 10 National Assembly.`,
      leaderName: '',
      leaderRole: 'Youth Convener',
      leaderPhone: '',
      meetingDay: 'Every Sunday at 3:30 PM',
      meetingFrequency: 'Weekly Mini-Caucus',
      memberCount: '0',
      members: '',
      subTeams: []
    },
    {
      id: `grp-${w.id}-3`,
      name: `${w.name} Women Table Banking & Food Sovereignty Network`,
      wardId: w.id,
      category: 'Youth & Women Empowerment',
      description: `Mutual support circle uniting women market traders, kitchen garden farmers, and community health champions in ${w.name}. Consolidating women’s economic justice resolutions for the December 10 National Assembly summit.`,
      leaderName: '',
      leaderRole: 'Network Coordinator',
      leaderPhone: '',
      meetingDay: 'Every Thursday at 4:00 PM',
      meetingFrequency: 'Weekly Mini-Caucus',
      memberCount: '0',
      members: '',
      subTeams: []
    },
    {
      id: `grp-${w.id}-4`,
      name: `${w.name} Civic Watch & Public Service Inspection Team`,
      wardId: w.id,
      category: 'Public Service Inspection',
      description: `Community watchdog conducting on-site verifications of borehole repairs, murram feeder roads, and health center medicine supplies in ${w.name}. Compiling ground audit reports for direct presentation to citizen delegates on December 10, 2026.`,
      leaderName: '',
      leaderRole: 'Chief Community Inspector',
      leaderPhone: '',
      meetingDay: 'Bi-weekly Tuesdays at 10:00 AM',
      meetingFrequency: 'Bi-Weekly Field Audit',
      memberCount: '0',
      members: '',
      subTeams: []
    }
  ];

  // Specific Sibembe group in Sikhendu Ward
  if (w.id === 'ward-7' || w.name.toLowerCase() === 'sikhendu') {
    list.unshift({
      id: 'grp-sikhendu-sibembe',
      name: 'Sibembe Community Group',
      wardId: w.id,
      category: 'Citizen Caucus Meeting',
      description: 'Grassroots community caucus in Sibembe, Sikhendu Ward (Trans Nzoia County). Holding citizen mini-caucuses including the session scheduled for tomorrow (October 20, 2026) to consolidate wananchi issues and resolutions for the December 10 National Assembly.',
      leaderName: 'Irene Nyongesa',
      leaderRole: 'Group Leader & Convener',
      leaderPhone: '',
      meetingDay: 'Tomorrow, Tuesday Oct 20, 2026 at 10:00 AM',
      meetingFrequency: 'Weekly Mini-Caucus',
      memberCount: '1',
      members: 'Irene Nyongesa (Group Leader)',
      subTeams: []
    });
  }

  return list;
}

function getInitialMockDB(): MockDB {
  const wards = [
    { id: 'ward-1', name: 'Kangemi', slug: 'kangemi', county: 'Nairobi', description: 'Nairobi County - Kangemi Ward' },
    { id: 'ward-2', name: 'Kitusuru', slug: 'kitusuru', county: 'Nairobi', description: 'Nairobi County - Kitusuru Ward' },
    { id: 'ward-3', name: 'Karura', slug: 'karura', county: 'Nairobi', description: 'Nairobi County - Karura Ward' },
    { id: 'ward-4', name: 'Mountain View', slug: 'mountain-view', county: 'Nairobi', description: 'Nairobi County - Mountain View Ward' },
    { id: 'ward-5', name: 'Parklands', slug: 'parklands', county: 'Nairobi', description: 'Nairobi County - Parklands Ward' },
    { id: 'ward-6', name: 'South Sakwa', slug: 'south-sakwa', county: 'Migori', description: 'Migori County - South Sakwa Ward' },
    { id: 'ward-7', name: 'Sikhendu', slug: 'sikhendu', county: 'Trans Nzoia', description: 'Trans Nzoia County - Sikhendu Ward' },
    { id: 'ward-8', name: 'Masaba', slug: 'masaba', county: 'Migori', description: 'Migori County - Masaba Ward' },
  ];

  const users = [
    {
      id: 'user-admin-1',
      name: 'Platform Administrator',
      phone: '0700000000',
      email: 'admin@csrg.ke',
      // sha-256 for 'admin123'
      password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
      role: 'ADMIN',
      wardId: null
    },
    {
      id: 'user-clerk-1',
      name: 'Ward Assembly Clerk',
      phone: '0711111111',
      email: 'clerk.kangemi@csrg.ke',
      // sha-256 for 'clerk123'
      password: 'a3630b8b8f6c82d33b0695f77f915e69ed7b0c5214062f8b870219845e069d30',
      role: 'CLERK',
      wardId: 'ward-1'
    }
  ];

  const discussions = wards.map((w, idx) => ({
    id: `disc-${idx + 1}`,
    title: `Citizen Assembly - ${w.name}`,
    description: `Discussing pressing community issues and wananchi proposals in ${w.name} Ward for the upcoming National Citizen Assembly on December 10, 2026.`,
    wardId: w.id,
    date: new Date(2026, 11, 10).toISOString(),
    status: 'OPEN',
    createdById: 'user-admin-1',
  })).concat([
    {
      id: 'disc-closed-1',
      title: 'Kangemi Ward Community Development Review 2025',
      description: 'Review of local development fund allocation and completed water piping infrastructure.',
      wardId: 'ward-1',
      date: new Date(2025, 10, 29).toISOString(),
      status: 'CLOSED',
      createdById: 'user-admin-1',
    }
  ]);

  const groups: any[] = [];
  wards.forEach((w) => {
    groups.push(...createDefaultGroupsForWard(w));
  });

  const issues: any[] = [];
  const resolutions: any[] = [];
  const assemblyDocuments: any[] = [];

  return {
    Ward: wards,
    User: users,
    Issue: issues,
    Discussion: discussions,
    Group: groups,
    Resolution: resolutions,
    AssemblyDocument: assemblyDocuments,
  };
}

function loadDB(): MockDB {
  if (typeof window === 'undefined') {
    return getInitialMockDB();
  }
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.Ward && parsed.Ward.length > 0) {
        // Strip legacy mock issues and mock resolutions
        if (Array.isArray(parsed.Issue)) {
          parsed.Issue = parsed.Issue.filter((it: any) => !String(it.id).startsWith('issue-'));
        }
        if (Array.isArray(parsed.Resolution)) {
          parsed.Resolution = parsed.Resolution.filter((r: any) => !String(r.id).startsWith('res-'));
        }
        if (!parsed.AssemblyDocument) {
          parsed.AssemblyDocument = [];
        }
        if (!parsed.Group) {
          parsed.Group = [];
        }

        // Deduplicate wards by lowercase name and slug
        const seenWards = new Set<string>();
        const dedupedWards: any[] = [];
        for (const w of parsed.Ward) {
          const normKey = (w.slug || w.name || '').trim().toLowerCase();
          if (!seenWards.has(normKey)) {
            seenWards.add(normKey);
            dedupedWards.push(w);
          }
        }

        // Ensure Masaba is always present in wards!
        const hasMasaba = dedupedWards.some(
          (w: any) => (w.slug && w.slug.toLowerCase() === 'masaba') || 
                      (w.name && w.name.toLowerCase().trim() === 'masaba')
        );
        if (!hasMasaba) {
          dedupedWards.push({
            id: 'ward-8',
            name: 'Masaba',
            slug: 'masaba',
            county: 'Migori',
            description: 'Migori County - Masaba Ward'
          });
        }

        // Ensure Sikhendu is always present in wards!
        const hasSikhendu = dedupedWards.some(
          (w: any) => (w.slug && w.slug.toLowerCase() === 'sikhendu') || 
                      (w.name && w.name.toLowerCase().trim() === 'sikhendu')
        );
        if (!hasSikhendu) {
          dedupedWards.push({
            id: 'ward-7',
            name: 'Sikhendu',
            slug: 'sikhendu',
            county: 'Trans Nzoia',
            description: 'Trans Nzoia County - Sikhendu Ward'
          });
        }
        parsed.Ward = dedupedWards;

        // Ensure each ward has groups and discussions
        for (const w of parsed.Ward) {
          const wardGroups = parsed.Group.filter((g: any) => g.wardId === w.id);
          if (wardGroups.length === 0) {
            parsed.Group.push(...createDefaultGroupsForWard(w));
          }
        }

        // Specifically ensure Sikhendu Ward always has the Sibembe Community Group
        const sikhendu = parsed.Ward.find(
          (w: any) => (w.slug && w.slug.toLowerCase() === 'sikhendu') || 
                      (w.name && w.name.toLowerCase().trim() === 'sikhendu')
        );
        if (sikhendu) {
          const hasSibembe = parsed.Group.some(
            (g: any) => g.id === 'grp-sikhendu-sibembe' || 
                        (g.name && g.name.toLowerCase().includes('sibembe'))
          );
          if (!hasSibembe) {
            parsed.Group.unshift({
              id: 'grp-sikhendu-sibembe',
              name: 'Sibembe Community Group',
              wardId: sikhendu.id,
              category: 'Citizen Caucus Meeting',
              description: 'Grassroots community caucus in Sibembe, Sikhendu Ward (Trans Nzoia County). Holding citizen mini-caucuses including the session scheduled for tomorrow (October 20, 2026) to consolidate wananchi issues and resolutions for the December 10 National Assembly.',
              leaderName: 'Irene Nyongesa',
              leaderRole: 'Group Leader & Convener',
              leaderPhone: '',
              meetingDay: 'Tomorrow, Tuesday Oct 20, 2026 at 10:00 AM',
              meetingFrequency: 'Weekly Mini-Caucus',
              memberCount: '1',
              members: 'Irene Nyongesa (Group Leader)',
              subTeams: []
            });
          }
        }

        // Clean any stale mock names from groups in local storage
        const isMockPersonName = (val: string) => {
          if (!val) return false;
          const lower = val.toLowerCase();
          return lower.includes('nyaboke') || 
                 lower.includes('sarah') || 
                 lower.includes('wanjiku') || 
                 lower.includes('charlie') || 
                 lower.includes('alice') || 
                 lower.includes('bob');
        };

        if (Array.isArray(parsed.Group)) {
          for (const g of parsed.Group) {
            const isSibembe = g.id === 'grp-sikhendu-sibembe' || g.name?.toLowerCase().includes('sibembe');
            if (isSibembe) {
              g.leaderName = 'Irene Nyongesa';
              g.leaderRole = 'Group Leader & Convener';
              
              // Clean members array for Sibembe
              const rawMembers = (g.members || '').split(',').map((m: string) => m.trim()).filter(Boolean);
              const cleanMembers = rawMembers.filter((m: string) => !isMockPersonName(m));
              if (!cleanMembers.some((m: string) => m.includes('Irene Nyongesa'))) {
                cleanMembers.unshift('Irene Nyongesa (Group Leader)');
              }
              g.members = cleanMembers.join(', ');
              g.memberCount = cleanMembers.length.toString();
            } else {
              // Non-Sibembe groups: remove mock leader names unless real person registered account
              if (g.leaderName && isMockPersonName(g.leaderName)) {
                g.leaderName = '';
              }
              // Clean mock members
              const rawMembers = (g.members || '').split(',').map((m: string) => m.trim()).filter(Boolean);
              const cleanMembers = rawMembers.filter((m: string) => !isMockPersonName(m));
              g.members = cleanMembers.join(', ');
              g.memberCount = cleanMembers.length.toString();
            }
          }
        }

        for (const w of parsed.Ward) {
          if (Array.isArray(parsed.Discussion)) {
            const hasDisc = parsed.Discussion.some((d: any) => d.wardId === w.id && d.status === 'OPEN');
            if (!hasDisc) {
              parsed.Discussion.push({
                id: `disc-${w.id}-open`,
                title: `Citizen Assembly - ${w.name}`,
                description: `Discussing pressing community issues and wananchi proposals in ${w.name} Ward for the upcoming National Citizen Assembly on December 10, 2026.`,
                wardId: w.id,
                date: new Date(2026, 11, 10).toISOString(),
                status: 'OPEN',
                createdById: 'user-admin-1',
              });
            }
          }
        }

        saveDB(parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse mock DB from localStorage:', e);
  }
  const initial = getInitialMockDB();
  saveDB(initial);
  return initial;
}

function saveDB(db: MockDB) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('Failed to save mock DB to localStorage:', e);
  }
}

// Helper to populate relations
function expandRelations(tableName: string, row: any, db: MockDB) {
  const item = { ...row };
  if (tableName === 'Ward') {
    item.issues = db.Issue.filter((i) => i.wardId === item.id);
    item.discussions = db.Discussion.filter((d) => d.wardId === item.id);
    item.groups = db.Group.filter((g) => g.wardId === item.id);
    item._count = {
      issues: item.issues.length,
      discussions: item.discussions.length,
      groups: item.groups.length,
      users: db.User.filter((u) => u.wardId === item.id).length
    };
  } else if (tableName === 'Issue') {
    item.ward = db.Ward.find((w) => w.id === item.wardId) || null;
  } else if (tableName === 'Discussion') {
    item.ward = db.Ward.find((w) => w.id === item.wardId) || null;
    item.resolutions = db.Resolution.filter((r) => r.discussionId === item.id);
  } else if (tableName === 'Group') {
    item.ward = db.Ward.find((w) => w.id === item.wardId) || null;
  } else if (tableName === 'AssemblyDocument') {
    item.ward = db.Ward.find((w) => w.id === item.wardId) || null;
  }
  return item;
}

class MockQueryBuilder implements PromiseLike<{ data: any; error: any }> {
  private tableName: string;
  private selectColumns: string = '*';
  private filters: Array<{ col: string; op: string; val: any }> = [];
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private mutateData: any = null;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private limitCount?: number;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    this.selectColumns = columns;
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.mutateData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.mutateData = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, op: 'eq', val });
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push({ col, op: 'neq', val });
    return this;
  }

  private orderRules: Array<{ col: string; ascending: boolean }> = [];

  order(col: string, options?: { ascending?: boolean }) {
    this.orderRules.push({ col, ascending: options?.ascending !== false });
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  single(): Promise<{ data: any; error: any }> {
    this.isSingle = true;
    return this.execute();
  }

  maybeSingle(): Promise<{ data: any; error: any }> {
    this.isMaybeSingle = true;
    return this.execute();
  }

  async execute(): Promise<{ data: any; error: any }> {
    const db = loadDB();
    if (!(db as any)[this.tableName]) {
      (db as any)[this.tableName] = [];
    }
    const table: any[] = (db as any)[this.tableName];

    if (this.action === 'insert') {
      const inserted: any[] = [];
      const newItems = Array.isArray(this.mutateData) ? this.mutateData : [this.mutateData];
      for (const item of newItems) {
        if (this.tableName === 'Ward') {
          const itemSlug = (item.slug || item.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const itemName = (item.name || '').trim().toLowerCase();
          const existingWard = table.find((w: any) => 
            ((w.slug || '').trim().toLowerCase() === itemSlug) ||
            ((w.name || '').trim().toLowerCase() === itemName)
          );
          if (existingWard) {
            inserted.push(existingWard);
            continue;
          }
        }
        const id = item.id || `${this.tableName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newItem = { ...item, id };
        table.push(newItem);
        inserted.push(newItem);

        if (this.tableName === 'Ward') {
          if (!db.Group) db.Group = [];
          const defaultGroups = createDefaultGroupsForWard(newItem);
          db.Group.push(...defaultGroups);
        }
      }
      saveDB(db);
      if (this.isSingle) {
        return { data: expandRelations(this.tableName, inserted[0], db), error: null };
      }
      return { data: inserted.map((i) => expandRelations(this.tableName, i, db)), error: null };
    }

    if (this.action === 'update') {
      const updated: any[] = [];
      for (let i = 0; i < table.length; i++) {
        let match = true;
        for (const f of this.filters) {
          if (f.op === 'eq' && table[i][f.col] !== f.val) match = false;
          if (f.op === 'neq' && table[i][f.col] === f.val) match = false;
        }
        if (match) {
          table[i] = { ...table[i], ...this.mutateData };
          updated.push(table[i]);
        }
      }
      saveDB(db);
      if (this.isSingle) {
        return { data: updated[0] ? expandRelations(this.tableName, updated[0], db) : null, error: null };
      }
      return { data: updated.map((i) => expandRelations(this.tableName, i, db)), error: null };
    }

    if (this.action === 'delete') {
      const remaining = table.filter((row) => {
        for (const f of this.filters) {
          if (f.op === 'eq' && row[f.col] === f.val) return false;
          if (f.op === 'neq' && row[f.col] !== f.val) return false;
        }
        return true;
      });
      (db as any)[this.tableName] = remaining;
      saveDB(db);
      return { data: null, error: null };
    }

    // Default: 'select'
    let results = table.filter((row) => {
      for (const f of this.filters) {
        if (f.op === 'eq' && row[f.col] !== f.val) return false;
        if (f.op === 'neq' && row[f.col] === f.val) return false;
      }
      return true;
    });

    // Apply orderRules
    if (this.orderRules.length > 0) {
      results.sort((a, b) => {
        for (const rule of this.orderRules) {
          const valA = a[rule.col];
          const valB = b[rule.col];
          if (valA === valB) continue;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          if (typeof valA === 'boolean' && typeof valB === 'boolean') {
            const comp = valA === valB ? 0 : valA ? -1 : 1;
            return rule.ascending ? -comp : comp;
          }
          const comp = valA > valB ? 1 : -1;
          return rule.ascending ? comp : -comp;
        }
        return 0;
      });
    }

    if (this.limitCount !== undefined) {
      results = results.slice(0, this.limitCount);
    }

    const mapped = results.map((row) => expandRelations(this.tableName, row, db));

    if (this.isSingle) {
      if (mapped.length === 0) {
        return { data: null, error: new Error(`No record found in ${this.tableName}`) };
      }
      return { data: mapped[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: mapped[0] || null, error: null };
    }

    return { data: mapped, error: null };
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Create the fallback mock client
function createMockClient(): any {
  return {
    from: (tableName: string) => new MockQueryBuilder(tableName),
    auth: {
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: '' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  };
}

let clientInstance: any = null;

if (isRealConfigProvided) {
  try {
    clientInstance = createClient(rawEnvUrl!, rawEnvKey!);
    console.log('[CSRG Kenya] Successfully connected to live Supabase project:', rawEnvUrl);
  } catch (err) {
    console.warn('[AI Studio] Supabase client init failed, switching to local store:', err);
    clientInstance = createMockClient();
  }
} else {
  // If no genuine Supabase URL or credentials are provided, use reliable local store
  clientInstance = createMockClient();
}

export const isLiveSupabaseConnected = isRealConfigProvided;
export const supabase = clientInstance;
