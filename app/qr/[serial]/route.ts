import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

type RouteParams = { params: { serial: string } };

export async function GET(_req: Request, { params }: RouteParams) {
  const { serial } = params;
  if (!serial) {
    return new NextResponse('serial is required', { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const url = `${base}/certificate/${encodeURIComponent(serial)}`;

  // Generate PNG as a Node Buffer
  const pngBuffer = await QRCode.toBuffer(url, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 6,
  });

  // Make a fresh Uint8Array copy to avoid SharedArrayBuffer typing
  const bytes = Uint8Array.from(pngBuffer);

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
