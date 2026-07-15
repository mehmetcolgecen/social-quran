import { NextResponse } from 'next/server';
import { getReciters } from '@/lib/db';

// Parametresiz GET route'ları build'de statikleştirilir; DB'siz imaj derlemesi
// kırılmasın diye çalışma anına zorlanır (bkz. lib/db.ts tembel açılış notu).
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(getReciters());
}
