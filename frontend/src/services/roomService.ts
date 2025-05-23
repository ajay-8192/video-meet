import { useState } from "react";
import apiService, { ApiError, isApiError } from "../utils/api";
import { useToast } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { RoomType } from "../context/RoomContext";


export const useRoomService = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<ApiError | null>(null);
    const [data, setData] = useState<any>(null);

    const { addToast } = useToast();
    const navigate = useNavigate();

    type CreateRoomPayload = {
        name: string;
        description: string;
        maxUsers: number;
        isPrivate: boolean;
        passwordProtected: boolean;
        password: string | undefined;
        inviteUsers: string[] | undefined
    };

    const handleCreateRoom = async (payload: CreateRoomPayload) => {
        setLoading(true);
        setData(null);

        try {
            const response = await apiService.post("/rooms/create", payload)
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
        } finally {
            setLoading(false);
        }
    };

    type FetchRoomsType = {
        roomType: "joined" | "invited" | "requestPending" | "public" | "all" | string;
    };

    interface RoomsResponse {
        rooms: {
            joined: RoomType[];
            invited: RoomType[];
            requestPending: RoomType[];
            public: RoomType[];
        };
    }


    const handleFetchRooms = async (payload: FetchRoomsType) => {
        setLoading(true);
        setData(null)

        try {
            let url = "";
            if (["joined", "invited", "requestPending", "public", "all"].includes(payload.roomType)) {
                url = `/rooms?roomType=${payload.roomType}`
            } else {
                url = "/rooms"
            }
            const response = await apiService.get<RoomsResponse>(url);
            setData(response)
            return response;
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
    }

    type SendJoinRespone = {
        message: string;
    };

    const handleSendJoinRequest = async (roomId: string) => {
        setLoading(true)
        setData(null)

        try {
            const response = await apiService.post<SendJoinRespone>(`/rooms/${roomId}/join`, {});
            setData(response)
            const message = response?.message || ""
            addToast(message, "success")
            navigate("/room/list?roomType=requestPending")
            return
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

    const handleCancelSendJoinRequest = async (roomId: string) => {
        setLoading(true)
        setData(null)

        try {
            const response = await apiService.post<SendJoinRespone>(`/rooms/${roomId}/cancel-join`, {});
            setData(response)
            const message = response?.message || ""
            addToast(message, "success")
            return
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

    return {
        loading,
        error,
        data,
        handleCreateRoom,
        handleFetchRooms,
        handleSendJoinRequest,
        handleCancelSendJoinRequest
    };
}