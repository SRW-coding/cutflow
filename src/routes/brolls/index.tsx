import { createFileRoute } from '@tanstack/react-router';
import { BrollsPage } from '@/features/brolls/brolls-page';

export const Route = createFileRoute('/brolls/')({
  component: () => <BrollsPage />,
});
