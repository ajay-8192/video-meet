import { useState } from "react";
import apiService, { ApiError, isApiError } from "../utils/api";
import { useToast } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";

export const useAuthService = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<ApiError | null>(null);
    const [data, setData] = useState<any>(null);

    const { addToast } = useToast();
    const navigate = useNavigate();

    type RegisterBody = {
        username: string;
        lastname: string;
        firstname: string;
        email: string;
    };

    type RegisterResponse = {
        message: string;
    }

    const handleRegister = async (payload: RegisterBody) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiService.post<RegisterResponse>("/register", payload);
            addToast(response?.message || "", "success")
            setData(response);
        } catch (error) {
            setData(null);
            if (isApiError(error)) {
                setError(error);
                const message = error.data?.error || "An unexpected error occurred";
                addToast(message, "error");
            } else {
                setError(error as ApiError);
                addToast("An unexpected error occurred", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    type VerifuAccountBody = {
        verifyId: string | null;
        email: string | null;
    };

    type VerifyAccountResponse = {
        message: string;
    }

    const handleVerifyAccount = async (payload: VerifuAccountBody) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiService.post<VerifyAccountResponse>("/verify-account", payload);
            setData(response);
            addToast(response?.message || "", "success")
            navigate("/login")
        } catch (error) {
            setData(null);
            if (isApiError(error)) {
                setError(error);
                const message = error.data?.error || "An unexpected error occurred";
                addToast(message, "error");
            } else {
                setError(error as ApiError);
                addToast("An unexpected error occurred", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    type SendOTPPayload = {
        email: string;
    };

    type SendOTPResponse = {
        message: string;
    }

    const handleSendOTP = async (payload: SendOTPPayload) => {
        setLoading(true);
        setData(null);

        try {
            const response = await apiService.post<SendOTPResponse>("/send-otp", payload);
            setData(response);
            addToast(response?.message || "", "success")
            navigate(`/verify-otp?email=${payload.email}`)
        } catch (error) {
            setData(null);
            if (isApiError(error)) {
                setError(error);
                const message = error.data?.error || "An unexpected error occurred";
                addToast(message, "error");
            } else {
                setError(error as ApiError);
                addToast("An unexpected error occurred", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    type VerifyOTPPayload = {
        email: string;
        otp: string;
    };

    const handleVerifyOTP = async (payload: VerifyOTPPayload) => {
        setLoading(true);
        setData(null);

        try {
            const response = await apiService.post("/verify-otp", payload)
            setData(response)
            navigate("/room/list")
        } catch (error) {
            setData(null);
            if (isApiError(error)) {
                setError(error);
                const message = error.data?.error || "An unexpected error occurred";
                addToast(message, "error");
            } else {
                setError(error as ApiError);
                addToast("An unexpected error occurred", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFetchDetails = async () => {
        setLoading(true)
        setData(null)

        try {
            const response = await apiService.get("/user")
            setData(response)
        } catch (error) {
            setData(null);
            if (isApiError(error)) {
                setError(error);
                const message = error.data?.error || "An unexpected error occurred";
                addToast(message, "error");
            } else {
                setError(error as ApiError);
                addToast("An unexpected error occurred", "error");
            }
            navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        setData(null);

        try {
            const response = await apiService.post("/delete-account", {})
            setData(response)
        } catch (error) {
            setData(null);
            if (isApiError(error)) {
                setError(error);
                const message = error.data?.error || "An unexpected error occurred";
                addToast(message, "error");
            } else {
                setError(error as ApiError);
                addToast("An unexpected error occurred", "error");
            }
            navigate("/register");
        } finally {
            setLoading(false);
        }
    };

    return {
        error,
        loading,
        data,
        handleRegister,
        handleVerifyAccount,
        handleSendOTP,
        handleVerifyOTP,
        handleFetchDetails,
        handleDeleteAccount
    };
};
