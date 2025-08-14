import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Shape exposed by the VIEW public.certificates
type CertView = {
  status: string;                 // already lowercase via the view
  org_name: string | null;
  issued_at: string | null;       // ISO string
  expires_at?: string | null;     // optional: include only if your view added it
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;

  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('certificates') // <-- the VIEW, not base table
    .select('status, org_name, issued_at, expires_at')
    .eq('serial', serial)
    .maybeSingle<CertView>();

  // Default to not valid if missing/error
  let valid = false;

  if (!error && data) {
    const status = (data.status ?? '').toLowerCase();
    valid = status === 'active';

    // Optional expiry check if the view exposes expires_at
    if (typeof data.expires_at === 'string' && data.expires_at.length > 0) {
      const exp = new Date(data.expires_at);
      if (!Number.isNaN(exp.getTime()) && exp <= new Date()) {
        valid = false;
      }
    }
  }

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
      'Cache-Control': 'public, max-age=60, s-maxage=60',
    },
  });
}
