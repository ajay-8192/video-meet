import { createContext, useContext, useState } from "react";

interface RoomType {
    id: string;
}

interface RoomContextType {
    rooms: RoomType[];
    currentRoom: RoomType | undefined;
    joinRoom: (room: RoomType) => void;
    leaveRoom: (roomId: string) => void;
    updateRooms: (rooms: RoomType[]) => void;
    updateSelectedRoom: (roomId: string) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined)

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [currentRoom, setCurrentRoom] = useState<RoomType | undefined>(undefined)

    const updateRooms = (rooms: RoomType[]) => {
        setRooms(rooms)
    }

    const updateSelectedRoom = (roomId: string) => {
        const room = rooms.find(rm => rm.id === roomId) || undefined;
        setCurrentRoom(room)
    };

    const joinRoom = (room: RoomType) => {
        setRooms([
            ...rooms,
            room
        ])
    };

    const leaveRoom = (roomId: string) => {
        const updatedRooms = rooms.filter(rm => rm.id !== roomId) || undefined;
        setRooms(updatedRooms)
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
