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

  // Registered groups across wards (Only Sibembe Food Coop in Sikhendu is pre-registered; other wards only have groups added by clerks or admin)
  const groups: any[] = [
    // Sikhendu Ward - Sibembe Food Coop (only legitimate group for now)
    {
      id: 'grp-sikhendu-sibembe',
      name: 'Sibembe Food Coop',
      wardId: 'ward-7',
      category: 'Agroecology & Food Sovereignty Cooperative',
      description: 'Grassroots food cooperative and peasant community caucus in Sibembe, Sikhendu Ward (Trans Nzoia County). Held 2-hour citizen mini-caucus on Tuesday, October 20, 2026 (10:00 AM – 12:00 PM) consolidating wananchi issues and resolutions for the December 10 National Assembly.',
      leaderName: 'Irene Nyongesa',
      leaderRole: 'Coop Leader & Convener',
      leaderPhone: '',
      meetingDay: 'Tuesday Oct 20, 2026 at 10:00 AM – 12:00 PM (2-Hour Citizen Deliberation)',
      meetingFrequency: 'Weekly Food Coop Caucus',
      memberCount: '1',
      members: 'Irene Nyongesa (Coop Leader)',
      subTeams: []
    }
  ];

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

        // Ensure Sikhendu (NOT Shikendu) is always present in wards and migrate any older Shikendu spellings!
        for (const w of dedupedWards) {
          if (w.name && (w.name.toLowerCase().trim() === 'shikendu' || w.name.toLowerCase().trim() === 'sikhendu')) {
            w.name = 'Sikhendu';
            w.slug = 'sikhendu';
            w.county = 'Trans Nzoia';
            w.description = 'Trans Nzoia County - Sikhendu Ward';
          }
        }

        const hasSikhendu = dedupedWards.some(
          (w: any) => (w.slug && (w.slug.toLowerCase() === 'sikhendu' || w.slug.toLowerCase() === 'shikendu')) || 
                      (w.name && (w.name.toLowerCase().trim() === 'sikhendu' || w.name.toLowerCase().trim() === 'shikendu'))
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

        // Ensure only legitimate groups exist:
        // Per user instruction:
        // "Please remove all Caucuses or groups in the wards drop down list and wards wall and show the ones added by clerks or admin, only sibembe is a legitimate group only for now."
        if (!Array.isArray(parsed.Group)) {
          parsed.Group = [];
        }

        const fakeGroupIds = new Set([
          'grp-south-sakwa-1', 'grp-south-sakwa-2', 'grp-south-sakwa-3',
          'grp-masaba-1', 'grp-masaba-2',
          'grp-kangemi-1', 'grp-kangemi-2', 'grp-kangemi-3',
          'grp-kitusuru-1', 'grp-karura-1',
          'grp-mountain-view-1', 'grp-parklands-1'
        ]);

        // Clean out fake groups and template placeholders
        parsed.Group = parsed.Group.filter((g: any) => {
          if (!g) return false;
          const gName = (g.name || '').toLowerCase();
          const gDesc = (g.description || '').toLowerCase();
          
          // Remove any group named or referencing "Sikhendu Agroecology" or "Farmers Cooperative"
          if (gName.includes('sikhendu agroecology') || gName.includes('farmers cooperative') || gDesc.includes('farmers cooperative')) {
            return false;
          }

          // In Sikhendu Ward, Sibembe Food Coop is the ONLY legitimate group for now
          const isSikhenduWard = g.wardId === 'ward-7' || g.wardName?.toLowerCase() === 'sikhendu' || g.id?.includes('sikhendu');
          if (isSikhenduWard) {
            const isSibembe = g.id === 'grp-sikhendu-sibembe' || g.id === 'grp-shikendu-sibembe' || gName.includes('sibembe');
            if (!isSibembe) return false;
          }

          // Keep Sibembe Food Coop in Sikhendu
          if (g.id === 'grp-sikhendu-sibembe' || g.id === 'grp-shikendu-sibembe' || gName.includes('sibembe')) {
            return true;
          }
          // Remove fake groups that do not exist
          if (fakeGroupIds.has(g.id)) return false;
          if (/^grp-ward-\d+-\d+$/i.test(g.id)) return false;
          if (/community action group/i.test(gName)) return false;
          // Keep any group legitimately registered by a clerk or admin
          return true;
        });

        // Ensure Sikhendu Ward has Sibembe Food Coop
        let sikhendu = parsed.Ward.find(
          (w: any) => (w.slug && (w.slug.toLowerCase() === 'sikhendu' || w.slug.toLowerCase() === 'shikendu')) || 
                      (w.name && (w.name.toLowerCase().trim() === 'sikhendu' || w.name.toLowerCase().trim() === 'shikendu'))
        );
        if (!sikhendu) {
          sikhendu = {
            id: 'ward-7',
            name: 'Sikhendu',
            slug: 'sikhendu',
            county: 'Trans Nzoia',
            description: 'Trans Nzoia County - Sikhendu Ward'
          };
          parsed.Ward.push(sikhendu);
        }

        let sibembeFound = false;
        for (const g of parsed.Group) {
          if (g.id === 'grp-sikhendu-sibembe' || g.id === 'grp-shikendu-sibembe' || (g.name && g.name.toLowerCase().includes('sibembe'))) {
            sibembeFound = true;
            g.id = 'grp-sikhendu-sibembe';
            g.name = 'Sibembe Food Coop';
            g.category = 'Agroecology & Food Sovereignty Cooperative';
            g.wardId = sikhendu.id || 'ward-7';
            g.leaderName = 'Irene Nyongesa';
            g.leaderRole = 'Group Leader & Convener';
            g.meetingFrequency = 'Weekly Food Coop Caucus';
            g.members = 'Irene Nyongesa (Group Leader)';
            g.memberCount = '1';
          }
        }

        if (!sibembeFound) {
          parsed.Group.unshift({
            id: 'grp-sikhendu-sibembe',
            name: 'Sibembe Food Coop',
            wardId: sikhendu ? sikhendu.id : 'ward-7',
            category: 'Agroecology & Food Sovereignty Cooperative',
            description: 'Grassroots food cooperative and peasant community caucus in Sibembe, Sikhendu Ward (Trans Nzoia County). Held 2-hour citizen mini-caucus on Tuesday, October 20, 2026 (10:00 AM – 12:00 PM) consolidating wananchi issues and resolutions for the December 10 National Assembly.',
            leaderName: 'Irene Nyongesa',
            leaderRole: 'Group Leader & Convener',
            leaderPhone: '',
            meetingDay: 'Tuesday Oct 20, 2026 at 10:00 AM – 12:00 PM (2-Hour Citizen Deliberation)',
            meetingFrequency: 'Weekly Food Coop Caucus',
            memberCount: '1',
            members: 'Irene Nyongesa (Group Leader)',
            subTeams: []
          });
        }

        // Clean up and purge mock resolutions from parsed.Resolution
        if (!Array.isArray(parsed.Resolution)) parsed.Resolution = [];
        parsed.Resolution = parsed.Resolution.filter((r: any) => {
          if (r.id === 'gres-sibembe-1' || r.id === 'gres-sibembe-2') return false;
          if (r.title && (
            r.title.includes('Mandate for the December 10 National Citizen Assembly') ||
            r.title.includes('Resolution 01/SIK/2026') ||
            r.title.includes('Resolution 01/2026') ||
            r.title.includes('Resolution 01/SHI/2026')
          )) return false;
          return true;
        });

        // Purge mock resolution from cached local storage key for Sibembe
        try {
          const sibembeResKey = 'csrg_grp_resolutions_grp-sikhendu-sibembe';
          const cachedRaw = localStorage.getItem(sibembeResKey);
          if (cachedRaw) {
            const cachedList = JSON.parse(cachedRaw);
            if (Array.isArray(cachedList)) {
              const cleaned = cachedList.filter((r: any) => 
                r.id !== 'gres-sibembe-1' &&
                r.id !== 'gres-sibembe-2' &&
                !r.title?.includes('Mandate for the December 10 National Citizen Assembly') &&
                !r.title?.includes('Resolution 01/SIK/2026') &&
                !r.title?.includes('Resolution 01/2026')
              );
              localStorage.setItem(sibembeResKey, JSON.stringify(cleaned));
            }
          }
        } catch {}

        if (!Array.isArray(parsed.AssemblyDocument)) parsed.AssemblyDocument = [];
        const hasSibembeDoc = parsed.AssemblyDocument.some((d: any) => 
          d.id === 'doc-sibembe-official-1' || (d.title && d.title.includes('Sibembe'))
        );
        if (!hasSibembeDoc) {
          parsed.AssemblyDocument.unshift({
            id: 'doc-sibembe-official-1',
            title: 'Official Sibembe Food Coop Citizen Mini-Caucus Assembly Resolutions & Minutes',
            category: 'Assembly Resolutions',
            wardId: sikhendu ? sikhendu.id : 'ward-7',
            wardName: 'Sikhendu',
            county: 'Trans Nzoia',
            documentDate: '2026-10-20',
            fileSize: '1.8 MB',
            fileType: 'PDF Document (Certified)',
            uploadedBy: 'Irene Nyongesa (Sibembe Food Coop Leader)',
            officerName: 'Irene Nyongesa (Sibembe Food Coop Leader)',
            isPinned: true,
            downloadCount: 42,
            summary: 'Certified resolutions and minutes from the 2-hour citizen mini-caucus held on Tuesday, Oct 20 (10:00 AM – 12:00 PM). Resolutions adopt community seed banks, solar borehole water pumps, and grassroots road oversight committees.',
            createdAt: '2026-10-20T12:00:00Z'
          });
        } else {
          for (const d of parsed.AssemblyDocument) {
            if (d.id === 'doc-sibembe-official-1' || d.title?.includes('Sibembe')) {
              d.wardName = 'Sikhendu';
              d.title = 'Official Sibembe Food Coop Citizen Mini-Caucus Assembly Resolutions & Minutes';
              d.uploadedBy = d.uploadedBy || 'Irene Nyongesa (Sibembe Food Coop Leader)';
              d.officerName = 'Irene Nyongesa (Sibembe Food Coop Leader)';
              d.wardId = sikhendu ? sikhendu.id : 'ward-7';
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
    const isSikhendu = item.slug === 'sikhendu' || item.name?.toLowerCase() === 'sikhendu' || item.id === 'ward-7' || item.slug === 'shikendu';
    item.groups = db.Group.filter((g) => {
      if (g.wardId === item.id) return true;
      if (isSikhendu && (g.id === 'grp-sikhendu-sibembe' || g.id === 'grp-shikendu-sibembe' || g.name?.toLowerCase().includes('sibembe'))) {
        return true;
      }
      return false;
    });
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

        if (this.tableName === 'User') {
          const isIrene = item.name && item.name.toLowerCase().includes('irene');
          if (isIrene) {
            const existingIrene = table.find((u: any) => 
              (u.name && u.name.toLowerCase().includes('irene')) || 
              (item.phone && u.phone === item.phone)
            );
            if (existingIrene) {
              existingIrene.password = item.password;
              if (item.phone) existingIrene.phone = item.phone;
              if (item.village) existingIrene.village = item.village;
              existingIrene.role = 'CITIZEN';
              existingIrene.name = 'Irene Nyongesa';
              existingIrene.organizationName = 'Sibembe Food Coop';
              
              // Ensure Sikhendu ward is assigned
              const sikhenduWard = (db.Ward || []).find((w: any) => 
                (w.slug && (w.slug.toLowerCase() === 'sikhendu' || w.slug.toLowerCase() === 'shikendu')) ||
                (w.name && (w.name.toLowerCase().includes('sikhendu') || w.name.toLowerCase().includes('shikendu')))
              );
              if (sikhenduWard) existingIrene.wardId = sikhenduWard.id;

              // Ensure Sibembe group links to Irene
              if (Array.isArray(db.Group)) {
                const sibembe = db.Group.find((g: any) => 
                  g.id === 'grp-sikhendu-sibembe' || 
                  g.id === 'grp-shikendu-sibembe' || 
                  g.name?.toLowerCase().includes('sibembe')
                );
                if (sibembe) {
                  sibembe.name = 'Sibembe Food Coop';
                  sibembe.leaderName = 'Irene Nyongesa';
                  sibembe.leaderRole = 'Coop Leader & Convener';
                }
              }

              inserted.push(existingIrene);
              continue;
            }
          }
        }

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
        if (f.op === 'eq') {
          // Special handling for Sikhendu Ward groups: Sibembe Food Coop is ALWAYS part of Sikhendu
          if (this.tableName === 'Group' && f.col === 'wardId') {
            const isSikhenduQuery = f.val === 'ward-7' || f.val === 'sikhendu' || f.val === 'shikendu';
            const isSibembeRow = row.id === 'grp-sikhendu-sibembe' || row.id === 'grp-shikendu-sibembe' || (row.name && row.name.toLowerCase().includes('sibembe'));
            if (isSikhenduQuery && isSibembeRow) {
              continue;
            }
          }
          if (row[f.col] !== f.val) return false;
        }
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
