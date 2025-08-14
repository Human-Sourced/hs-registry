import { NextResponse, type NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CertView = {
  status: string | null;
  org_name: string | null;
  issued_at: string | null;
};

export async function GET(req: NextRequest, context: { params: { serial: string } }) {
  const raw = context.params.serial ?? '';
  const serial = decodeURIComponent(raw).replace(/\.svg$/i, '');

  let supabase;
  try {
    supabase = getServerSupabase();
  } catch {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="80" role="img" aria-label="Human‑Sourced: Error">
  <rect width="420" height="80" rx="12" fill="#ef4444"/>
  <text x="210" y="48" text-anchor="middle" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" font-size="18" fill="#fff">
    Human‑Sourced: Config error (Supabase env vars)
  </text>
</svg>`,
      { status: 500, headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store' } }
    );
  }

  const { data, error } = await supabase
    .from('certificates')
    .select('status, org_name, issued_at')
    .eq('serial', serial)
    .maybeSingle<CertView>();

  if (error) {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="80" role="img" aria-label="Human‑Sourced: Error">
  <rect width="420" height="80" rx="12" fill="#f59e0b"/>
  <text x="210" y="48" text-anchor="middle" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" font-size="18" fill="#fff">
    Human‑Sourced: DB error
  </text>
</svg>`,
      { status: 502, headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store' } }
    );
  }

  const statusLower = (data?.status ?? '').toLowerCase();
  const valid = statusLower === 'active';
  const label = valid ? 'Valid' : 'Not Valid';
  const color = valid ? '#22c55e' : '#9ca3af';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80" role="img" aria-label="Human‑Sourced: ${label}">
  <rect width="300" height="80" rx="12" fill="${color}"/>
  <text x="150" y="48" text-anchor="middle" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" font-size="22" fill="#fff">
    Human‑Sourced: ${label}
  </text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
