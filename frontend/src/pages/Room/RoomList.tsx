import useApiRequest from "../../hooks/useAPIRequest";
import { construct_api_urls } from "../../constants/api";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRoom } from "../../context/RoomContext";
import RoomSection from "../../components/RoomSection";
import { useNavigate } from "react-router-dom";
import Room from "../../components/Room";

const RoomList: React.FC = () => {

    const { user } = useAuth();
    const { updateRooms, rooms } = useRoom();
    const navigate = useNavigate();
    const { loading, error, data, refetch: fetchRooms } = useApiRequest(construct_api_urls.listRooms());

    const [searchQuery, setSearchQuery] = useState("");

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

    // Filter rooms based on search query
    const filterRooms = (roomsList: any) => {
        if (!searchQuery) return roomsList;
        
        return roomsList.filter((room: any) => 
            room.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            room.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const navigateToCreateRoom = () => {
        navigate("/rooms/create");
        return;
    };

    if (loading) return <center>Loading...</center>

    if (error) return <center>Error...</center>

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold mb-6">Rooms</h1>

                    <div className="flex justify-between items-center">
                        <div className="relative flex-1 max-w-md">
                            <span className="material-symbols-rounded absolute !text-lg left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Search rooms..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <button
                            onClick={navigateToCreateRoom}
                            className="bg-blue-500 text-white cursor-pointer px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center ml-4"
                        >
                            <span className="material-symbols-rounded mr-2 !text-lg">
                                add_circle
                            </span>
                            Create Room
                        </button>
                    </div>
                </header>

                <main>
                    <RoomSection
                        title="My Rooms" 
                        icon={<span className="material-symbols-rounded text-blue-500 !text-xl">
                                group
                            </span>}
                        emptyMessage="You haven't joined any rooms yet."
                    >
                        {filterRooms(rooms.joined).map((room: any) => (
                            <Room key={room.id} room={room} type="my" />
                        ))}
                    </RoomSection>

                    <RoomSection
                        title="Invitations" 
                        icon={<span className="material-symbols-rounded text-amber-500 !text-xl">
                                notifications
                            </span>}
                        emptyMessage="No pending invitations."
                    >
                        {filterRooms(rooms.invited).map((room: any) => (
                            <Room key={room.id} room={room} type="invited" />
                        ))}
                    </RoomSection>

                    <RoomSection
                        title="Pending Join Requests" 
                        icon={<span className="material-symbols-rounded text-purple-500 !text-xl">
                                person_add
                            </span>}
                        emptyMessage="No pending join requests."
                    >
                        {filterRooms(rooms.pending).map((room: any) => (
                            <Room key={room.id} room={room} type="request" />
                        ))}
                    </RoomSection>

                    <RoomSection
                        title="Public Rooms" 
                        icon={<span className="material-symbols-rounded text-green-500 !text-xl">
                                group
                            </span>}
                        emptyMessage="No public rooms available."
                    >
                        {filterRooms(rooms.public).map((room: any) => (
                            <Room key={room.id} room={room} type="public" />
                        ))}
                    </RoomSection>
                </main>
            </div>
        </div>
    );
};

export default RoomList;
