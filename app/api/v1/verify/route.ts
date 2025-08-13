import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type CertRow = {
  serial: string;
  org_name: string;
  status: 'active' | 'revoked' | 'expired';
  issued_at: string; // ISO string
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const serial = url.searchParams.get('serial');
  if (!serial) {
    return NextResponse.json({ error: 'serial is required' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceKey);

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
