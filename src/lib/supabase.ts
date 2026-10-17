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
}

function getInitialMockDB(): MockDB {
  const wards = [
    { id: 'ward-1', name: 'Kangemi', slug: 'kangemi', description: 'Nairobi County - Kangemi Ward' },
    { id: 'ward-2', name: 'Kitusuru', slug: 'kitusuru', description: 'Nairobi County - Kitusuru Ward' },
    { id: 'ward-3', name: 'Karura', slug: 'karura', description: 'Nairobi County - Karura Ward' },
    { id: 'ward-4', name: 'Mountain View', slug: 'mountain-view', description: 'Nairobi County - Mountain View Ward' },
    { id: 'ward-5', name: 'Parklands', slug: 'parklands', description: 'Nairobi County - Parklands Ward' },
    { id: 'ward-6', name: 'South Sakwa', slug: 'south-sakwa', description: 'Migori County - South Sakwa Ward' },
    { id: 'ward-7', name: 'Sikhendu', slug: 'sikhendu', description: 'Trans Nzoia County - Sikhendu Ward' },
  ];

  const users = [
    {
      id: 'user-admin-1',
      name: 'Admin User',
      phone: '0700000000',
      email: 'admin@csrg.ke',
      // sha-256 for 'admin123'
      password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
      role: 'ADMIN',
      wardId: null
    },
    {
      id: 'user-clerk-1',
      name: 'Jane Wanjiku',
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
    description: `Discussing pressing community issues and wananchi proposals in ${w.name} Ward for the upcoming assembly.`,
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

  const resolutions = [
    {
      id: 'res-1',
      discussionId: 'disc-closed-1',
      text: 'Prioritize water supply line upgrades and scheduled rationing notices by Q2 2026.',
      createdAt: new Date(2025, 10, 29).toISOString()
    },
    {
      id: 'res-2',
      discussionId: 'disc-closed-1',
      text: 'Establish a citizen road drainage oversight team to inspect culvert clearings before the rainy season.',
      createdAt: new Date(2025, 10, 29).toISOString()
    }
  ];

  const groups = wards.map((w, idx) => ({
    id: `grp-${idx + 1}`,
    name: `${w.name} Community Action Group`,
    wardId: w.id,
    leaderName: idx % 2 === 0 ? 'Jane Wanjiku' : 'David Otieno',
    meetingDay: 'Wednesday',
    meetingFrequency: 'Weekly',
    memberCount: '15',
    members: 'Alice W., Bob K., Charlie M., Grace N., David O.'
  }));

  const issues = [
    {
      id: 'issue-1',
      title: 'Water Supply Reliability & Transparent Rationing Schedule',
      description: 'Residents experience unpredictable water disruptions. We request a published weekly timetable and fast response to burst main pipes.',
      wardId: 'ward-1',
      votes: 45,
      createdAt: new Date(2026, 2, 10).toISOString()
    },
    {
      id: 'issue-2',
      title: 'Installation of Solar Street Lighting along Commercial Corridors',
      description: 'High-mast solar lights are needed along the main market road to bolster security for evening traders and commuters.',
      wardId: 'ward-1',
      votes: 38,
      createdAt: new Date(2026, 2, 14).toISOString()
    },
    {
      id: 'issue-3',
      title: 'Stormwater Culvert Clearing & Road Drainage',
      description: 'Clearing clogged road drainages to prevent erosion and flash flooding along feeder pathways during seasonal rains.',
      wardId: 'ward-2',
      votes: 29,
      createdAt: new Date(2026, 2, 18).toISOString()
    },
    {
      id: 'issue-4',
      title: 'Designated Community Waste Sorting & Collection Hub',
      description: 'Establish a structured collection drop-off for plastics and organic waste to curb illegal dumping along riverbanks.',
      wardId: 'ward-3',
      votes: 34,
      createdAt: new Date(2026, 2, 22).toISOString()
    }
  ];

  return {
    Ward: wards,
    User: users,
    Issue: issues,
    Discussion: discussions,
    Group: groups,
    Resolution: resolutions,
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

  order(_col: string, _options?: { ascending?: boolean }) {
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
    const table: any[] = (db as any)[this.tableName] || [];

    if (this.action === 'insert') {
      const inserted: any[] = [];
      const newItems = Array.isArray(this.mutateData) ? this.mutateData : [this.mutateData];
      for (const item of newItems) {
        const id = item.id || `${this.tableName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newItem = { ...item, id };
        table.push(newItem);
        inserted.push(newItem);
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
  } catch (err) {
    console.warn('[AI Studio] Supabase client init failed, switching to local store:', err);
    clientInstance = createMockClient();
  }
} else {
  // If no genuine Supabase URL or credentials are provided, use reliable local store
  clientInstance = createMockClient();
}

export const supabase = clientInstance;
