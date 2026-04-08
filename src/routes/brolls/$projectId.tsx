import { createFileRoute } from '@tanstack/react-router';
import { BrollsPage } from '@/features/brolls/brolls-page';

export const Route = createFileRoute('/brolls/$projectId')({
  component: BrollsProject,
});

function BrollsProject() {
  const { projectId } = Route.useParams();
  return <BrollsPage fixedProjectId={projectId} />;
}

