import { useLocation } from "react-router-dom";
import { useAuthService } from "../../services/authServices";
import { useEffect } from "react";
import { useToast } from "../../context/NotificationContext";

const VerifyAccountPage: React.FC = () => {

    const { error, loading, handleVerifyAccount } = useAuthService();

    const { addToast } = useToast();

    const { search } = useLocation();
    const query = new URLSearchParams(search);

    useEffect(() => {
        const email = query.get("email")
        const verifyId = query.get("verifyId")
        if (!email || !verifyId) {
            addToast("Invalid URL to verify account", "error")
        } else {
            handleVerifyAccount({
                email,
                verifyId
            })
        }
    }, []);

    if (loading) return <div>Verifying Account...</div>

    if (error) return <div>Failed to verify Account</div>

    return (
        <div>Verify Account Successful</div>
    );
};

export default VerifyAccountPage;