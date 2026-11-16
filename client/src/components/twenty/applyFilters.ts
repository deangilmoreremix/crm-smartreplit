export interface FilterCondition {
  field: string;
  operator: string;
  value: any;
}

/** Apply FilterBuilder conditions (all must match) to flat records. */
export function applyFilters<T extends Record<string, any>>(records: T[], conditions: FilterCondition[]): T[] {
  return records.filter((record) =>
    conditions.every(({ field, operator, value }) => {
      const raw = record[field];
      const actual = raw == null ? '' : String(raw).toLowerCase();
      const expected = value == null ? '' : String(value).toLowerCase();
      const num = Number(raw);
      const target = Number(value);
      switch (operator) {
        case 'eq':
          return actual === expected;
        case 'neq':
          return actual !== expected;
        case 'contains':
          return actual.includes(expected);
        case 'startsWith':
          return actual.startsWith(expected);
        case 'endsWith':
          return actual.endsWith(expected);
        case 'gt':
          return num > target;
        case 'gte':
          return num >= target;
        case 'lt':
          return num < target;
        case 'lte':
          return num <= target;
        case 'isEmpty':
          return actual === '';
        case 'isNotEmpty':
          return actual !== '';
        default:
          return true;
      }
    })
  );
}
