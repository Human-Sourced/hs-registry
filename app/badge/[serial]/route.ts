import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type CertView = {
  status: string | null;     // lowercased via the view
  org_name: string | null;
  issued_at: string | null;  // ISO string
  // If you later add expires_at to the view, add it here and in .select(...)
  // expires_at: string | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial: raw } = await params;
  // Handle requests like /badge/HS-...-000001.svg  → strip the extension
  const serial = decodeURIComponent(raw).replace(/\.svg$/i, '');

  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('certificates')                 // the VIEW
    .select('status, org_name, issued_at')// add 'expires_at' if your view exposes it
    .eq('serial', serial)
    .maybeSingle<CertView>();

  let valid = false;
  if (!error && data) {
    const statusLower = (data.status ?? '').toLowerCase();
    valid = statusLower === 'active';

    // If you later add expires_at, gate here too:
    // if (data.expires_at) {
    //   const exp = new Date(data.expires_at);
    //   if (!Number.isNaN(exp.getTime()) && exp <= new Date()) valid = false;
    // }
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
      // Disable caching while we iterate; you can relax later
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
