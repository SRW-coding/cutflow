import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/dashboard/')({
  component: UserDashboardPage,
});

function UserDashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: '/dashboard/profile', replace: true });
  }, [navigate]);

  return null;
}
