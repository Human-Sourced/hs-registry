import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;

  const supabase = getServerSupabase();

  // Read from the VIEW so status is already normalized to lowercase
  const { data, error } = await supabase
    .from('certificates') // <-- the VIEW, not the base table
    .select('status, org_name, issued_at, expires_at') // expires_at is optional if you didn't add it
    .eq('serial', serial)
    .maybeSingle();

  // Default to not valid on errors/missing
  let valid = false;
  if (!error && data) {
    // normalize status defensively in case of schema changes
    const status = typeof (data as any).status === 'string'
      ? ((data as any).status as string).toLowerCase()
      : '';

    valid = status === 'active';

    // Optional: consider expiry if the view includes it
    const exp = (data as any).expires_at ? new Date((data as any).expires_at) : null;
    if (exp && !isNaN(exp.getTime())) {
      const now = new Date();
      if (exp <= now) valid = false;
    }
  }

  const label = valid ? 'Valid' : 'Not Valid';
  const color = valid ? '#22c55e' /* green-500 */ : '#9ca3af' /* gray-400 */;

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
      'Cache-Control': 'public, max-age=60, s-maxage=60',
    },
  });
}
