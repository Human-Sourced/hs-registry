import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('certificates')
    .select('status, org_name')
    .eq('serial', serial)
    .maybeSingle();

  // Simple badge (green for active, gray otherwise)
  const valid = !!data && data.status === 'active';
  const label = valid ? 'Valid' : 'Not Valid';
  const color = valid ? '#22c55e' : '#9ca3af';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80" role="img" aria-label="Human‑Sourced: ${label}">
  <rect width="300" height="80" rx="12" fill="${color}"/>
  <text x="150" y="48" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="22" fill="#fff">
    Human‑Sourced: ${label}
  </text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
