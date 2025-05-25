import { useEffect } from "react";
import { useAuthService } from "../services/authServices";
import { useAuth } from "../context/AuthContext";

const AuthRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const { user, login } = useAuth();
    const { data, loading, handleFetchDetails } = useAuthService();

    useEffect(() => {
        if (!user?.id) {
            console.log('===> AuthRoot -> 25: Fetching user details');
            handleFetchDetails();
        }
    }, [user]);

    
    useEffect(() => {
        if (data?.user) {
            login(data?.user)
        }
    }, [data])
    
    if (loading || !user?.id) return <div>Fetching user details...</div>

    return children;
};

export default AuthRoot;
