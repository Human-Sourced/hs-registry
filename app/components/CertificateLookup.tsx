"use client";

export default function CertificateLookup() {
  return (
    <div className="rounded-2xl border px-4 py-4">
      <div className="text-sm text-gray-500">Certificate Lookup</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem('serial') as HTMLInputElement | null;
          const raw = input?.value?.trim();
          if (!raw) return;
          const s = encodeURIComponent(raw);
          window.location.href = `/certificate/${s}`;
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
  );
}
