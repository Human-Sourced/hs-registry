import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Row shape exposed by the VIEW public.certificates
type CertView = {
  status: string | null;     // lowercased in the view
  org_name: string | null;
  issued_at: string | null;  // ISO string
  // If you later add `expires_at` to the view, just add:
  // expires_at?: string | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;

  const supabase = getServerSupabase();

  // Let Supabase infer the response type; ask only for columns that exist in the view
  const { data, error } = await supabase
    .from('certificates') // <-- the VIEW
    .select('status, org_name, issued_at')
    .eq('serial', serial)
    .maybeSingle<CertView>();

  // Default to not valid
  let valid = false;

  if (!error && data) {
    const statusLower = (data.status ?? '').toLowerCase();
    valid = statusLower === 'active';
    // If you add expires_at in the view later, you can gate here too.
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
