import { supabaseServer } from '@/lib/supabase';

// Next 15 passes params as a Promise in app router
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;

  const supabase = supabaseServer();
  const { data: cert, error } = await supabase
    .from('certifications')
    .select(`
      serial_id, status, tier, standard_version, issued_at, expires_at, disclosure_summary, seal_asset_url,
      organizations ( public_name, website, slug, logo_url )
    `)
    .eq('serial_id', decodeURIComponent(serial))
    .single();

  if (error || !cert) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-lg font-semibold">Certificate not found</h1>
        <p className="text-sm text-gray-600 mt-2">
          The certificate “{serial}” does not exist or is no longer public.
        </p>
      </main>
    );
  }

  // Supabase relation can be object or array; normalize
  const orgField = (cert as any).organizations as any[] | any | undefined;
  const org = Array.isArray(orgField) ? (orgField[0] ?? null) : (orgField ?? null);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        {org?.logo_url && <img src={org.logo_url} alt="" className="h-10 w-10 rounded-lg" />}
        <div>
          <h1 className="text-xl font-semibold">{org?.public_name ?? 'Organization'}</h1>
          {org?.website && (
            <p className="text-sm text-gray-600">
              <a className="underline" href={org.website} target="_blank" rel="noreferrer">
                {org.website}
              </a>
            </p>
          )}
        </div>
      </div>

      <img
        src={`/badge/${encodeURIComponent(cert.serial_id)}.svg`}
        alt="Human-Sourced Certification Badge"
        className="w-full max-w-lg"
      />

      <div className="rounded-2xl border p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="font-medium">Serial</dt><dd>{cert.serial_id}</dd></div>
          <div><dt className="font-medium">Tier</dt><dd>{cert.tier}</dd></div>
          <div><dt className="font-medium">Status</dt><dd>{cert.status}</dd></div>
          <div><dt className="font-medium">Standard</dt><dd>{cert.standard_version}</dd></div>
          <div><dt className="font-medium">Issued</dt><dd>{new Date(cert.issued_at).toLocaleDateString()}</dd></div>
          <div><dt className="font-medium">Expires</dt><dd>{cert.expires_at ? new Date(cert.expires_at).toLocaleDateString() : '—'}</dd></div>
        </dl>
      </div>

      {cert.disclosure_summary && (
        <div className="rounded-2xl border p-4">
          <h2 className="font-medium mb-2">Disclosure Summary</h2>
          <p className="text-sm text-gray-800">{cert.disclosure_summary}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <img src={`/qr/${encodeURIComponent(cert.serial_id)}.png`} alt="QR" className="h-24 w-24" />
        <p className="text-xs text-gray-600">
          Scan to verify on registry • Content Credentials supported where available (C2PA).
        </p>
      </div>
    </main>
  );
}
