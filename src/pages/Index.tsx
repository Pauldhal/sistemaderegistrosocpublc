import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinanceDashboard } from "@/components/dashboard/FinanceDashboard";
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-gold text-2xl font-bold animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <FinanceDashboard userId={user.id} />;
};

export default Index;
