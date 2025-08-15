import { getServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Row = {
  serial: string;
  org_name: string | null;
  status: string | null;     // lowercased in your view
  issued_at: string | null;  // ISO
};

// helpers to read query params safely (Next can pass arrays)
function first(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}
function toTitle(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
const VALID_STATUSES = ['active','conditional','expired','suspended','revoked'] as const;
type Status = typeof VALID_STATUSES[number];

export default async function RegistryPage({
  searchParams,
}: {
  // Your project typed route props with Promises earlier, so we follow suit
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};

  const q = first(sp, 'q').trim();
  const statusRaw = first(sp, 'status').toLowerCase();
  const status: Status | '' =
    (VALID_STATUSES as readonly string[]).includes(statusRaw) ? (statusRaw as Status) : '';
  const sortRaw = first(sp, 'sort');
  const sort: 'issued_at' | 'org_name' | 'serial' =
    sortRaw === 'org_name' || sortRaw === 'serial' ? sortRaw : 'issued_at';
  const dir: 'asc' | 'desc' = first(sp, 'dir').toLowerCase() === 'asc' ? 'asc' : 'desc';

  const pageNum = Number.parseInt(first(sp, 'page') || '1', 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = getServerSupabase();

  let query = supabase
    .from('certificates')
    .select('serial, org_name, status, issued_at', { count: 'exact' });

  if (q) {
    // search org_name OR serial (case-insensitive)
    // ilike uses %wildcards%
    query = query.or(`org_name.ilike.%${q}%,serial.ilike.%${q}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }
  query = query.order(sort, { ascending: dir === 'asc' }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold">Human‑Sourced Registry</h1>
        <p className="mt-4 text-red-600">Error loading registry: {String((error as unknown as { message?: string }).message ?? error)}</p>
      </main>
    );
  }

  const rows = (data ?? []) as Row[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // helper to rebuild URLs with updated params
  const qs = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({
      q,
      status,
      sort,
      dir,
      page: String(page),
      ...overrides,
    });
    // remove empty filters from the URL for cleanliness
    if (!params.get('q')) params.delete('q');
    if (!params.get('status')) params.delete('status');
    return `?${params.toString()}`;
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Human‑Sourced Registry</h1>
        <p className="text-gray-600">
          Search certified organizations and verify certificate status. Results are live from the official registry.
        </p>
      </header>

      <form className="flex flex-wrap items-center gap-3" action="/registry" method="get">
        <input
          className="flex-1 min-w-[240px] rounded-xl border px-3 py-2"
          name="q"
          placeholder="Search by organization or serial…"
          defaultValue={q}
        />
        <select className="rounded-xl border px-3 py-2" name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {VALID_STATUSES.map(s => (
            <option key={s} value={s}>{toTitle(s)}</option>
          ))}
        </select>
        <select className="rounded-xl border px-3 py-2" name="sort" defaultValue={sort}>
          <option value="issued_at">Issued date</option>
          <option value="org_name">Organization</option>
          <option value="serial">Serial</option>
        </select>
        <select className="rounded-xl border px-3 py-2" name="dir" defaultValue={dir}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        <button className="rounded-xl bg-black text-white px-4 py-2" type="submit">Apply</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-sm">
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Serial</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Badge</th>
              <th className="px-4 py-3">Certificate</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-gray-500">
                  No results. Try a different search or clear filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const issued = row.issued_at ? new Date(row.issued_at).toLocaleDateString() : '—';
                const st = (row.status ?? '').toLowerCase();
                const chip =
                  st === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : st === 'conditional'
                    ? 'bg-amber-100 text-amber-800'
                    : st === 'expired'
                    ? 'bg-gray-200 text-gray-700'
                    : st === 'suspended'
                    ? 'bg-orange-100 text-orange-800'
                    : st === 'revoked'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-700';
                return (
                  <tr key={row.serial} className="border-t">
                    <td className="px-4 py-3">{row.org_name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono">{row.serial}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-1 text-xs ${chip}`}>
                        {st ? toTitle(st) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{issued}</td>
                    <td className="px-4 py-3">
                      <a className="text-blue-600 underline" href={`/badge/${encodeURIComponent(row.serial)}.svg`} target="_blank">SVG</a>
                    </td>
                    <td className="px-4 py-3">
                      <a className="text-blue-600 underline" href={`/certificate/${encodeURIComponent(row.serial)}`}>View</a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <nav className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Page {page} of {totalPages} • {total} total</span>
        <div className="flex gap-2">
          <a
            className={`rounded-xl border px-3 py-2 ${page <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
            href={qs({ page: String(page - 1) })}
          >
            Prev
          </a>
          <a
            className={`rounded-xl border px-3 py-2 ${page >= totalPages ? 'opacity-50 pointer-events-none' : ''}`}
            href={qs({ page: String(page + 1) })}
          >
            Next
          </a>
        </div>
      </nav>
    </main>
  );
}
