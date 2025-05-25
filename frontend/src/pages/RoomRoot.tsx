import { useEffect } from "react";
import { useRoom } from "../context/RoomContext";
import { useRoomService } from "../services/roomService";

const RoomRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const { loading, data, handleFetchRooms } = useRoomService();
    const { updateRooms } = useRoom();

    useEffect(() => {
        if (data?.rooms) {
            console.log('===> RoomRoot -> 13:', data?.rooms);
            updateRooms(data?.rooms);
        }
    }, [data?.rooms]);

    useEffect(() => {
        console.log('===> RoomRoot -> 20: Fetching rooms');
        handleFetchRooms({ roomType: "all" });
    }, [])

    if (loading || !data?.rooms) {
        return <div>Loading...</div>
    }

    return children
};

export default RoomRoot;
