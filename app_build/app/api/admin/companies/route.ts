// @witness [C-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const _user = await requireAdmin(request);

    const companies = await db
      .selectFrom('profiles')
      .select(['org_name', 'gstin', 'verification_status'])
      .where('org_name', 'is not', null)
      .groupBy(['org_name', 'gstin', 'verification_status'])
      .execute();

    const companiesWithPersonnel = await Promise.all(companies.map(async (c) => {
      const count = await db.selectFrom('company_personnel').select((eb) => eb.fn.count('id').as('count')).where('company_gstin', '=', c.gstin).executeTakeFirstOrThrow();
      return { ...c, personnel_count: Number(count.count) };
    }));

    return NextResponse.json({ success: true, data: companiesWithPersonnel });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch companies' } }, { status: 500 });
  }
}
