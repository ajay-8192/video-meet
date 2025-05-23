import { createContext, useState } from "react";

type ChatContextTypes = {
    roomId: string;
    users: any[];
    updateRoomId: (id: string) => void;
    updateChatRoomUsers: (users: any[]) => void;
};

const ChatContext = createContext<ChatContextTypes | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [roomId, setRoomId] = useState<string>("");

    const [users, setUsers] = useState<any[]>([])

    const updateRoomId = (id: string) => {
        setRoomId(id)
    }

    const updateChatRoomUsers = (users: any[]) => {
        setUsers(users)
    }

    return (
        <ChatContext.Provider value={{ roomId, users, updateRoomId, updateChatRoomUsers }}>
            {children}
        </ChatContext.Provider>
    );
};
