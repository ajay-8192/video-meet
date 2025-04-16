import { Outlet, useNavigate } from "react-router-dom";
import useApiRequest from "../../hooks/useAPIRequest";
import { construct_api_urls } from "../../constants/api";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { RoomProvider } from "../../context/RoomContext";

const AuthRoot: React.FC = () => {

    const { user, login } = useAuth();
    const navigate = useNavigate();
    const { loading, error, data, cancel, refetch } = useApiRequest(construct_api_urls.userDetails());

    useEffect(() => {
        if (user?.id) {
            cancel()
        } else {
            refetch(construct_api_urls.userDetails(), {
                method: "GET",
                credentials: "include",
                headers: { 'Content-Type': 'application/json' },
            })
        }
    }, [])

    useEffect(() => {
        if (data?.user) {
            login(data.user)
        }
    }, [data])

    if (loading) return <div>Loading...</div>

    if (error) {
        alert("User not loggedIn")
        setTimeout(() => {
            navigate("/login")
        }, 3000)
        return
    }

    return (
        <RoomProvider>
            <div>Auth Root</div>
            <Outlet />
        </RoomProvider>
    );
};

export default AuthRoot;
