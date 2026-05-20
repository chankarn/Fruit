// File: app/(app)/expenses/page.tsx
import { PageHeader } from '@/components/layout/page-header';
import { EntryForm } from '@/components/forms/entry-form';

export default function ExpensesPage() {
  return (
    <>
      <PageHeader title="บันทึกรายจ่าย" subtitle="ซื้อของอะไรเข้าร้านบ้าง" />
      <EntryForm mode="expenses" />
    </>
  );
}
