import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type CertRow = {
  serial: string;
  org_name: string;
  status: 'active' | 'revoked' | 'expired';
  issued_at: string;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const serial = url.searchParams.get('serial');
  if (!serial) {
    return NextResponse.json({ error: 'serial is required' }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('serial', serial)
    .maybeSingle<CertRow>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ valid: false, serial }, { status: 404 });
  }

  return NextResponse.json({
    valid: data.status === 'active',
    serial: data.serial,
    org: data.org_name,
    status: data.status,
    issued_at: data.issued_at,
  });
}
