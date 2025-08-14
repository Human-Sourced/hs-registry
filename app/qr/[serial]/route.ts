import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  // Example path: /qr/HS-C-2025-000001.png or /qr/HS-C-2025-000001
  const url = new URL(req.url);
  const raw = url.pathname.split('/').pop() ?? '';
  const serial = decodeURIComponent(raw).replace(/\.png$/i, '');

  if (!serial) return new NextResponse('serial is required', { status: 400 });

  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (!base) return new NextResponse('BASE_URL not configured', { status: 500 });

  const target = `${base}/certificate/${encodeURIComponent(serial)}`;

  const pngBuffer = await QRCode.toBuffer(target, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 6,
  });

  // Convert Node Buffer -> TypedArray for Web Response
  const bytes = new Uint8Array(pngBuffer);

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
