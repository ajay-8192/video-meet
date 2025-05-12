import { useEffect } from "react";
import { useAuthService } from "../services/authServices";
import { useAuth } from "../context/AuthContext";
import { Outlet } from "react-router-dom";

const AuthRoot: React.FC = () => {

    const { user, login } = useAuth();
    const { data, loading, handleFetchDetails } = useAuthService();

    useEffect(() => {
        if (!user?.id) {
            handleFetchDetails();
        }
    }, [user]);

    
    useEffect(() => {
        console.log('====> ', { data });
        if (data?.user) {
            login(data?.user)
        }
    }, [data])
    
    if (loading) return <div>Fetching user details...</div>

    return (
        <>
            <Outlet />
        </>
    );
};

export default AuthRoot;
