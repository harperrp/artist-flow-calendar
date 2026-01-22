import { Navigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

const Index = () => {
  const { loading, user } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app/calendar" replace /> : <Navigate to="/login" replace />;
};

export default Index;
