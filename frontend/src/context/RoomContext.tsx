import { createContext, useContext, useEffect, useState } from "react";

interface RoomType {
    id: string;
    allow_chat: boolean;
    allow_screen_share: boolean;
    createdAt: string;
    createdBy: string;
    description: string;
    isPrivate: boolean;
    maxUsers: number
    mute_on_entry: boolean;
    name: string;
    require_password: boolean;
}

type RoomsType = {
    invited: RoomType[];
    joined: RoomType[];
    public: RoomType[];
    pending: RoomType[];
};

interface RoomContextType {
    rooms: RoomsType;
    currentRoom: RoomType | undefined;
    joinRoom: (room: RoomType) => void;
    leaveRoom: (roomId: string) => void;
    updateRooms: (rooms: RoomsType) => void;
    updateSelectedRoom: (roomId: string) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined)

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [rooms, setRooms] = useState<RoomsType>({
        invited: [],
        joined: [],
        pending: [],
        public: []
    });
    const [currentRoom, setCurrentRoom] = useState<RoomType | undefined>(undefined)

    const updateRooms = (rooms: RoomsType) => {
        setRooms(rooms)
    }

    useEffect(() => {
        console.log('====> ', { rooms });
    }, [rooms])

    const updateSelectedRoom = (roomId: string) => {
        console.log('====> ', { roomId });
        const room = rooms.joined.find(rm => rm.id === roomId) || undefined;
        setCurrentRoom(room)
    };

    const joinRoom = (room: RoomType) => {
        console.log('======> ', { room });
    };

    const leaveRoom = (roomId: string) => {
        console.log('====> ', { roomId });
    };

    return (
        <RoomContext.Provider value={{ rooms, currentRoom, updateRooms, updateSelectedRoom, joinRoom, leaveRoom }}>
            {children}
        </RoomContext.Provider>
    )
};

export const useRoom = (): RoomContextType => {
    const context = useContext(RoomContext);
    if (context === undefined) {
        throw new Error("UseRoom must be used within an RoomProvider")
    }
    return context;;
}
