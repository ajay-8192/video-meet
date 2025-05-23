import { useEffect, useState } from "react";
import { useRoom } from "../../context/RoomContext";
import { useLocation, useNavigate } from "react-router-dom";
import RoomCard from "../../components/RoomCard";
import { useRoomService } from "../../services/roomService";

const RoomListPage: React.FC = () => {

    const { rooms, updateRooms } = useRoom();
    const navigate = useNavigate();

    const { search } = useLocation();
    const query = new URLSearchParams(search);
    const roomType = query.get("roomType") || "";

    const { data, handleFetchRooms } = useRoomService();

    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState(roomType || 'joined');

    useEffect(() => {
        handleFetchRooms({ roomType: activeTab })
    }, [activeTab])

    useEffect(() => {
        console.log('===> 22:', data);            
        if (data?.rooms) {
            updateRooms(data?.rooms)
        }
    }, [data])

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

    const tabs = [
        {
            id: 'joined',
            label: 'My Rooms',
            icon: <span className="material-symbols-rounded text-blue-500 !text-xl mr-2">
                group
            </span>,
            count: rooms.joined.length,
            badge: rooms.joined.reduce((acc: number, room: any) => acc + room?.unreadMessages, 0)
        },
        {
            id: 'invited',
            label: 'Invitations',
            icon: <span className="material-symbols-rounded text-amber-500 !text-xl mr-2">
                notifications
            </span>,
            count: rooms.invited.length,
            badge: 0
        },
        {
            id: 'requestPending',
            label: 'Join Requests',
            icon: <span className="material-symbols-rounded text-purple-500 !text-xl mr-2">
                person_add
            </span>,
            count: rooms.pending.length,
            badge: 0
        },
        {
            id: 'public',
            label: 'Public Rooms',
            icon: <span className="material-symbols-rounded text-blue-500 !text-xl mr-2">
                group
            </span>,
            count: 0,
            badge: 0
        }
    ];

    const getCurrentTabContent = () => {
        let activeRoomsList: any[] = [];

        switch (activeTab) {
            case "joined":
                activeRoomsList = rooms.joined
                break;
            case "invited":
                activeRoomsList = rooms.invited
                break
            case "requestPending":
                activeRoomsList = rooms.pending
                break
            case "public":
                activeRoomsList = rooms.public
                break
            default:
                break;
        }

        const currentRooms = filterRooms(activeRoomsList);

        if (currentRooms.length === 0) {
            return (
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    <div>
                        {activeTab === 'joined' && "You haven't joined any rooms yet."}
                        {activeTab === 'invited' && "No pending invitations."}
                        {activeTab === 'requestPending' && "No pending join requests."}
                        {activeTab === 'public' && "No public rooms available."}
                    </div>

                    {activeTab === 'public' && (
                        <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Create a Room
                        </button>
                    )}
                </div>
            );
        }

        return currentRooms.map((room: any) => (
            <RoomCard
                key={room.id}
                room={activeTab === "invited" ? { ...room, ...room.Room } : room}
                type={
                    activeTab === 'joined' ? 'my' :
                        activeTab === 'invited' ? 'invited' :
                            activeTab === 'requestPending' ? 'request' : 'public'
                }
            />
        ));
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <header className="mb-8">
                <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Rooms</h1>
                        <button
                            onClick={navigateToCreateRoom}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
                        >
                            <span className="material-symbols-rounded mr-2 !text-lg">
                                add_circle
                            </span>
                            Create Room
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <span className="material-symbols-rounded absolute left-3 !text-lg top-1/2 transform -translate-y-1/2 text-gray-400">
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

                    <div className="flex border-b">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`flex cursor-pointer items-center px-4 py-3 text-sm font-medium border-b-2 ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon}
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                                        {tab.count}
                                    </span>
                                )}
                                {tab.badge > 0 && (
                                    <span className="ml-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </header>

                <main>
                    {getCurrentTabContent()}
                </main>
            </div>
        </div>
    );
};

export default RoomListPage;
