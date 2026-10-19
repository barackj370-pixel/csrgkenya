// Utility to dynamically calculate National Citizen Assembly dates every 3 months (quarterly)
// Assemblies are held quarterly on the 10th of the month (March 10, June 10, September 10, December 10).

export interface AssemblyEvent {
  id: string;
  quarter: string; // 'Q1', 'Q2', 'Q3', 'Q4'
  name: string;
  theme: string;
  date: Date;
  dateString: string;
  formattedDate: string;
  isPast: boolean;
  isNext: boolean;
  daysRemaining: number;
  location: string;
}

export function getQuarterlyAssemblyDate(year: number, monthIndex: number): Date {
  // monthIndex: 0 = Jan, 1 = Feb, 2 = March, ..., 11 = Dec
  // Target: 10th of the quarter month (aligned with the December 10 National Assembly Summit)
  const date = new Date(year, monthIndex, 10, 9, 0, 0, 0);
  return date;
}

const QUARTER_MONTHS = [
  { quarter: 'Q1', monthIndex: 2, label: 'March' },
  { quarter: 'Q2', monthIndex: 5, label: 'June' },
  { quarter: 'Q3', monthIndex: 8, label: 'September' },
  { quarter: 'Q4', monthIndex: 11, label: 'December' },
];

const THEMES: Record<string, string> = {
  Q1: 'Devolution CADP Budget Priorities & Seed Sovereignty Ratification',
  Q2: 'Water, Agroecology & Smallholder Food Systems Accountability',
  Q3: 'Public Service Delivery, Roads & Youth Employment Social Audit',
  Q4: 'National Citizen Assembly Annual Resolutions & Governance Review',
};

export function getAllQuarterlyAssemblies(startYear = 2025, endYear = 2027): AssemblyEvent[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const list: AssemblyEvent[] = [];

  for (let year = startYear; year <= endYear; year++) {
    for (const q of QUARTER_MONTHS) {
      const date = getQuarterlyAssemblyDate(year, q.monthIndex);
      const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const isPast = dateTime < today;
      const diffTime = dateTime - today;
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      list.push({
        id: `assembly-${year}-${q.quarter}`,
        quarter: `${q.quarter} ${year}`,
        name: `National Citizen Assembly (${q.quarter} ${year})`,
        theme: THEMES[q.quarter] || 'Sovereign Citizen Deliberations',
        date,
        dateString: date.toISOString().split('T')[0],
        formattedDate,
        isPast,
        isNext: false,
        daysRemaining,
        location: 'Ufungamano House, Nairobi & Hybrid Ward Delegates Nationwide'
      });
    }
  }

  // Sort chronologically
  list.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Mark the immediate next upcoming assembly
  const nextItem = list.find(item => !item.isPast) || list[list.length - 1];
  if (nextItem) {
    nextItem.isNext = true;
  }

  return list;
}

export function getNextNationalAssembly(): AssemblyEvent {
  const all = getAllQuarterlyAssemblies();
  const next = all.find(a => a.isNext);
  if (next) return next;
  return all[all.length - 1];
}

export function getPastNationalAssemblies(): AssemblyEvent[] {
  return getAllQuarterlyAssemblies().filter(a => a.isPast).reverse();
}

export function getUpcomingNationalAssemblies(): AssemblyEvent[] {
  return getAllQuarterlyAssemblies().filter(a => !a.isPast);
}
