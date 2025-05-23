import { createContext, useState, useContext } from "react";

type ChatContextTypes = {
    roomId: string;
    users: any[];
    updateRoomId: (id: string) => void;
    updateChatRoomUsers: (users: any[]) => void;
};

const ChatContext = createContext<ChatContextTypes | undefined>(undefined);

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }
    return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [roomId, setRoomId] = useState<string>("");
    const [users, setUsers] = useState<any[]>([]);

    const updateRoomId = (id: string) => {
        setRoomId(id);
    };

    const updateChatRoomUsers = (users: any[]) => {
        setUsers(users);
    };

    return (
        <ChatContext.Provider value={{ roomId, users, updateRoomId, updateChatRoomUsers }}>
            {children}
        </ChatContext.Provider>
    );
};
