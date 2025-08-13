import { createClient } from '@supabase/supabase-js';

type CertRow = {
  serial: string;
  org_name: string;
  status: 'active' | 'revoked' | 'expired';
  issued_at: string; // ISO
};

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  // Next 15: params is a Promise
  const { serial } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('serial', serial)
    .maybeSingle<CertRow>();

  if (error || !data) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Certificate not found</h1>
        <p className="mt-2 text-gray-500">Serial: {serial}</p>
      </main>
    );
  }

  const badgeUrl = `/badge/${encodeURIComponent(serial)}.svg`;
  const qrUrl = `/qr/${encodeURIComponent(serial)}.png`;

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Human‑Sourced Certificate</h1>

      <section className="space-y-1">
        <div className="text-lg"><strong>Serial:</strong> {data.serial}</div>
        <div><strong>Organization:</strong> {data.org_name}</div>
        <div><strong>Status:</strong> {data.status}</div>
        <div><strong>Issued:</strong> {new Date(data.issued_at).toLocaleString()}</div>
      </section>

      {/* These are fine as <img> for now; warnings only */}
      <img alt="Verification Badge" src={badgeUrl} width={240} height={240} />
      <img alt="QR Code" src={qrUrl} width={240} height={240} />
    </main>
  );
}
