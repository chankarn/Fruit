// File: app/(app)/sales/page.tsx
import { PageHeader } from '@/components/layout/page-header';
import { EntryForm } from '@/components/forms/entry-form';

export default function SalesPage() {
  return (
    <>
      <PageHeader title="บันทึกรายรับ" subtitle="ขายอะไรไปบ้างวันนี้" />
      <EntryForm mode="sales" />
    </>
  );
}
