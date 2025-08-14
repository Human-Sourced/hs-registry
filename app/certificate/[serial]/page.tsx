import Image from 'next/image';
import { getServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type CertRow = {
  serial: string;
  org_name: string;
  status: string; // lowercased text from the view
  issued_at: string;
};

// Safe error-to-string helper (no `any`)
function getErrMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    return typeof m === 'string' ? m : JSON.stringify(m);
  }
  try {
    return String(e);
  } catch {
    return 'Unknown error';
  }
}

export default async function CertificatePage({
  params,
}: {
  // Your project expects Promise params (per previous build error)
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;

  let supabase;
  try {
    supabase = getServerSupabase();
  } catch {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Configuration error</h1>
        <p className="mt-2 text-gray-500">Supabase env vars are missing.</p>
      </main>
    );
  }

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('serial', serial)
    .maybeSingle<CertRow>();

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Database error</h1>
        <p className="mt-2 text-gray-500">{getErrMessage(error)}</p>
      </main>
    );
  }

  if (!data) {
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

      {/* Using Next/Image to satisfy the lint rule */}
      <Image alt="Verification Badge" src={badgeUrl} width={240} height={240} />
      <Image alt="QR Code" src={qrUrl} width={240} height={240} />
    </main>
  );
}
