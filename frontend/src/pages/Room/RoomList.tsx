import useApiRequest from "../../hooks/useAPIRequest";
import { construct_api_urls } from "../../constants/api";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRoom } from "../../context/RoomContext";
import { useNavigate } from "react-router-dom";
import Room from "../../components/Room";

const RoomList: React.FC = () => {

    const { user } = useAuth();
    const { updateRooms, rooms } = useRoom();
    const navigate = useNavigate();
    const { loading, error, data, refetch: fetchRooms } = useApiRequest(construct_api_urls.listRooms());

    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState('myRooms');

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

    const tabs = [
        {
            id: 'myRooms',
            label: 'My Rooms',
            icon: <span className="material-symbols-rounded text-blue-500 !text-xl mr-2">
                group
            </span>,
            count: rooms.joined.length,
            badge: rooms.joined.reduce((acc: number, room: any) => acc + room?.unreadMessages, 0)
        },
        {
            id: 'invitedRooms',
            label: 'Invitations',
            icon: <span className="material-symbols-rounded text-amber-500 !text-xl mr-2">
                notifications
            </span>,
            count: rooms.invited.length,
            badge: 0
        },
        {
            id: 'joinRequests',
            label: 'Join Requests',
            icon: <span className="material-symbols-rounded text-purple-500 !text-xl mr-2">
                person_add
            </span>,
            count: rooms.pending.length,
            badge: 0
        },
        {
            id: 'publicRooms',
            label: 'Public Rooms',
            icon: <span className="material-symbols-rounded text-blue-500 !text-xl mr-2">
                group
            </span>,
            count: rooms.public.length,
            badge: 0
        }
    ];

    const getCurrentTabContent = () => {
        let activeRoomsList = undefined

        switch (activeTab) {
            case "myRooms":
                activeRoomsList = rooms.joined
                break;
            case "invitedRooms":
                activeRoomsList = rooms.invited
                break
            case "joinRequests":
                activeRoomsList = rooms.pending
                break
            case "publicRooms":
                activeRoomsList = rooms.public
                break
            default:
                break;
        }

        const currentRooms = filterRooms(activeRoomsList);

        if (currentRooms.length === 0) {
            return (
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    {activeTab === 'myRooms' && "You haven't joined any rooms yet."}
                    {activeTab === 'invitedRooms' && "No pending invitations."}
                    {activeTab === 'joinRequests' && "No pending join requests."}
                    {activeTab === 'publicRooms' && "No public rooms available."}

                    {activeTab === 'publicRooms' && (
                        <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Create a Room
                        </button>
                    )}
                </div>
            );
        }

        return currentRooms.map((room: any) => (
            <Room
                key={room.id}
                room={activeTab === "invitedRooms" ? { ...room, ...room.Room } : room}
                type={
                    activeTab === 'myRooms' ? 'my' :
                        activeTab === 'invitedRooms' ? 'invited' :
                            activeTab === 'joinRequests' ? 'request' : 'public'
                }
            />
        ));
    };

    if (loading) return <center>Loading...</center>

    if (error) return <center>Error...</center>

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


                    {/* <div className="flex justify-between items-center">
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
                        </div> */}

                        {/* <button
                            onClick={navigateToCreateRoom}
                            className="bg-blue-500 text-white cursor-pointer px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center ml-4"
                        >
                            <span className="material-symbols-rounded mr-2 !text-lg">
                                add_circle
                            </span>
                            Create Room
                        </button> */}
                    {/* </div> */}
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
                    {/* <RoomSection
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
                            <Room key={room.id} room={{ ...room, ...room.Room }} type="invited" />
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
                    </RoomSection> */}
                </main>
            </div>
        </div>
    );
};

export default RoomList;
