import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

const colors: Record<string, string> = {
  ACTIVE: '#16a34a',
  CONDITIONAL: '#ca8a04',
  EXPIRED: '#6b7280',
  SUSPENDED: '#ef4444',
  REVOKED: '#991b1b',
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ serial: string }> } // <-- async params in Next 15
) {
  const { serial } = await ctx.params; // must await
  // If user visited /badge/<serial>.svg, strip the extension
  const cleanSerial = serial.replace(/\.svg$/i, '');

  console.log('badge lookup for:', cleanSerial);

  const supabase = supabaseServer();
  const { data: cert, error } = await supabase
    .from('certifications')
    .select('serial_id,status,tier')
    .eq('serial_id', cleanSerial)
    .single();

  if (error) console.error('supabase error:', error);

  if (!cert) {
    console.warn('no cert found for:', cleanSerial);
    return new NextResponse('not found', { status: 404 });
  }

  const fill = colors[cert.status] ?? '#6b7280';
  const label = `Human-Sourced • ${cert.tier.replace('_', '-')} • ${cert.status}`;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="460" height="38" role="img" aria-label="${label}">
  <rect rx="6" width="460" height="38" fill="${fill}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#fff" font-family="ui-sans-serif, system-ui" font-size="14">${label}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'max-age=60, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
