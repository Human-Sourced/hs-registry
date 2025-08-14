import { NextResponse, type NextRequest } from 'next/server';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest, context: { params: { serial: string } }) {
  const raw = context.params.serial ?? '';
  const serial = decodeURIComponent(raw).replace(/\.png$/i, '');

  if (!serial) return new NextResponse('serial is required', { status: 400 });

  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (!base) return new NextResponse('BASE_URL not configured', { status: 500 });

  const url = `${base}/certificate/${encodeURIComponent(serial)}`;

  const pngBuffer = await QRCode.toBuffer(url, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 6,
  });

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
