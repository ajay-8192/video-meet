import { createContext, useContext, useEffect, useState } from "react";

export interface RoomType {
    id: string;
    allow_chat: boolean;
    allow_screen_share: boolean;
    createdAt: string;
    createdBy: string;
    description: string;
    isPrivate: boolean;
    maxUsers: number;
    mute_on_entry: boolean;
    name: string;
    require_password: boolean;
    unreadMessages?: number;
}

type RoomsType = {
    invited: RoomType[];
    joined: RoomType[];
    public: RoomType[];
    pending: RoomType[];
};

interface RoomContextType {
    currentRoom: RoomType | null;
    rooms: RoomsType;
    joinRoom: (room: RoomType) => void;
    leaveRoom: (roomId: string) => void;
    updateRooms: (rooms: RoomsType) => void;
    updateSelectedRoom: (roomId: string) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [rooms, setRooms] = useState<RoomsType>({
        invited: [],
        joined: [],
        pending: [],
        public: []
    });

    const joinRoom = (room: RoomType) => {
        console.log('======> ', { room });
    };

    const leaveRoom = (roomId: string) => {
        console.log('====> ', { roomId });
    };

    const updateRooms = (newRooms: RoomsType) => {
        setRooms({
            ...rooms,
            ...newRooms
        })
    }

    useEffect(() => {
        console.log('====> ', { rooms });
    }, [rooms])

    const updateSelectedRoom = (roomId: string) => {
        console.log('====> ', { roomId });
        const room = rooms.joined.find(rm => rm.id === roomId) || null;
        setCurrentRoom(room)
    };

    const [currentRoom, setCurrentRoom] = useState<RoomType | null>(null)

    return (
        <RoomContext.Provider
            value={{
                currentRoom,
                rooms,
                joinRoom,
                leaveRoom,
                updateRooms,
                updateSelectedRoom
            }}
        >
            {children}
        </RoomContext.Provider>
    )
}

export const useRoom = (): RoomContextType => {
    const context = useContext(RoomContext);
    if (context === undefined) {
        throw new Error("UseRoom must be used within an RoomProvider")
    }
    return context;;
}
