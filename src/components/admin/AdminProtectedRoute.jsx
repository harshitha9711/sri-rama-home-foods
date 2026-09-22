import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
export default function AdminProtectedRoute(){const{user,loading,isAuthenticated}=useAuth();const location=useLocation();if(loading)return <main className="min-h-screen bg-brand-cream grid place-items-center px-4"><p className="text-sm font-semibold text-black/60">Checking admin session...</p></main>;if(!isAuthenticated)return <Navigate to="/admin/login" replace state={{from:location.pathname}}/>;if(user?.role!=="admin")return <Navigate to="/" replace/>;return <Outlet/>}
