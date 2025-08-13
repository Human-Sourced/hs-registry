import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

type OrgLite = { public_name?: string | null; website?: string | null } | null;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serial = searchParams.get('serial');
  if (!serial) return NextResponse.json({ error: 'serial required' }, { status: 400 });

  const supabase = supabaseServer();
  const { data: cert, error } = await supabase
    .from('certifications')
    .select(`
      serial_id, status, tier, standard_version, issued_at, expires_at, disclosure_summary,
      organizations ( public_name, website )
    `)
    .eq('serial_id', serial)
    .single();

  if (error || !cert) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Normalize organizations: it might come back as an array or an object
  const orgField = (cert as any).organizations as OrgLite | OrgLite[] | undefined;
  const org: OrgLite = Array.isArray(orgField) ? (orgField[0] ?? null) : (orgField ?? null);

  return NextResponse.json({
    serial_id: cert.serial_id,
    status: cert.status,
    tier: cert.tier,
    standard_version: cert.standard_version,
    issued_at: cert.issued_at,
    expires_at: cert.expires_at,
    organization: {
      public_name: org?.public_name ?? null,
      website: org?.website ?? null
    },
    disclosure_summary: cert.disclosure_summary,
    last_verified_at: new Date().toISOString()
  });
}
