import { useEffect } from "react";
import { construct_api_urls } from "../../constants/api";
import useApiRequest from "../../hooks/useAPIRequest";
import { useLocation } from "react-router-dom";

const VerifyAccount: React.FC = () => {

    const { data, error, loading, refetch: verifyAccount } = useApiRequest(construct_api_urls.verifyAccount())

    const { search } = useLocation();
    const query = new URLSearchParams(search);

    useEffect(() => {
        verifyAccount(construct_api_urls.verifyAccount(), {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            // credentials: "include",
            body: JSON.stringify({ email: query.get("email"), verifyId: query.get("verifyId") }),
        })
    }, [])

    if (loading) return <center>Loading...</center>

    if (error) return <center>Error...</center>

    if (data) console.log('====> ', { data });

    return (
        <div>Verify Account</div>
    );
};

export default VerifyAccount;
