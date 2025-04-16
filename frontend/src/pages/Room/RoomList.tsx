import useApiRequest from "../../hooks/useAPIRequest";
import { construct_api_urls } from "../../constants/api";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRoom } from "../../context/RoomContext";

const RoomList: React.FC = () => {

    const { user } = useAuth();
    const { updateRooms, rooms } = useRoom();
    const { loading, error, data, refetch: fetchRooms } = useApiRequest(construct_api_urls.listRooms())

    useEffect(() => {
        if (user?.id) {
            fetchRooms(construct_api_urls.listRooms(), {
                method: "GET",
                credentials: "include",
                headers: { 'Content-Type': 'application/json' },
            })
        }
    }, [user])

    useEffect(() => {
        if (data?.rooms) {
            updateRooms(data.rooms);
        }
    }, [data])

    if (loading) return <center>Loading...</center>

    if (error) return <center>Error...</center>

    return (
        <div>
            {JSON.stringify(rooms, null, 2)}
        </div>
    );
};

export default RoomList;
