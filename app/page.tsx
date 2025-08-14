// Minimal homepage for registry.human-sourced.com
// Purpose: let anyone quickly search or verify a certificate.
// Styling assumes Tailwind is already configured (it is in your project).

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-black" aria-hidden />
            <span className="text-lg font-semibold">Human‑Sourced Registry</span>
          </div>
          <nav className="text-sm">
            <a
              href="https://human-sourced.com"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Main Site →
            </a>
          </nav>
        </div>
      </header>

      {/* Hero / Search */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Verify a Human‑Sourced certification
        </h1>
        <p className="mt-2 text-gray-600 max-w-2xl">
          This is the official registry. Search certified organizations or check a certificate by serial.
        </p>

        {/* Search form: GET → /registry?q=... */}
        <form
          action="/registry"
          method="get"
          className="mt-6 flex flex-col sm:flex-row gap-3"
          aria-label="Search certified organizations"
        >
          <input
            type="search"
            name="q"
            required
            placeholder="Search by organization name or serial (e.g., HS‑C‑2025‑000001)…"
            className="flex-1 min-w-[260px] rounded-xl border px-4 py-3 text-base"
          />
          <button
            type="submit"
            className="rounded-xl bg-black text-white px-5 py-3 text-base font-medium"
          >
            Search Registry
          </button>
        </form>

        {/* Quick actions */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <a
            href="/registry"
            className="rounded-2xl border px-4 py-4 hover:shadow-sm transition"
          >
            <div className="text-sm text-gray-500">Browse</div>
            <div className="text-lg font-semibold">View all certified orgs</div>
            <div className="mt-1 text-sm text-gray-600">
              Filter by status, sort by date, and open certificates.
            </div>
          </a>

          <div className="rounded-2xl border px-4 py-4">
            <div className="text-sm text-gray-500">Verify by Serial</div>
            <form
              action="/api/v1/verify"
              method="get"
              className="mt-2 flex gap-2"
              aria-label="Verify by serial number"
            >
              <input
                type="text"
                name="serial"
                placeholder="HS‑C‑YYYY‑NNNNNN"
                className="flex-1 rounded-xl border px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                className="rounded-xl bg-black text-white px-3 py-2 text-sm font-medium"
              >
                Check
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-500">
              Returns JSON with validity, status, and issue date.
            </p>
          </div>

          <div className="rounded-2xl border px-4 py-4">
            <div className="text-sm text-gray-500">Certificate Lookup</div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.currentTarget.elements.namedItem('serial') as HTMLInputElement);
                if (input?.value) {
                  const s = encodeURIComponent(input.value.trim());
                  window.location.href = `/certificate/${s}`;
                }
              }}
              className="mt-2 flex gap-2"
              aria-label="Open certificate page by serial number"
            >
              <input
                type="text"
                name="serial"
                placeholder="HS‑C‑YYYY‑NNNNNN"
                className="flex-1 rounded-xl border px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                className="rounded-xl bg-black text-white px-3 py-2 text-sm font-medium"
              >
                Open
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-500">
              Opens the public certificate page with badge and QR.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-gray-600 flex flex-wrap items-center gap-3 justify-between">
          <div>© {new Date().getFullYear()} Human‑Sourced</div>
          <div className="flex gap-4">
            <a href="/registry" className="hover:underline">Registry</a>
            <a href="https://human-sourced.com" className="hover:underline" target="_blank" rel="noreferrer">
              Learn about the Standard
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
