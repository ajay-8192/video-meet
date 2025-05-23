import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useChatContext } from "../../context/ChatContext";
import { useRoom } from "../../context/RoomContext";
import { useRoomService } from "../../services/roomService";
import apiService from "../../utils/api";

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: string;
    createdAt?: string;
}

interface ResponseData {
    messageData: Message[]
}

interface PostResponseData {
    content: Message
}

const RoomChatPage: React.FC = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { updateRoomId } = useChatContext();
    const { rooms, updateRooms } = useRoom();
    const { handleFetchRooms } = useRoomService();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch joined rooms when component mounts
        const fetchJoinedRooms = async () => {
            const response = await handleFetchRooms({ roomType: "joined" });
            if (response && 'rooms' in response && response.rooms?.joined) {
                updateRooms({
                    ...rooms,
                    joined: response.rooms.joined
                });
            }
        };
        fetchJoinedRooms();
    }, []);

    useEffect(() => {
        if (roomId) {
            updateRoomId(roomId);
            fetchMessages();
        }
    }, [roomId]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const response = await apiService.get<ResponseData>(`/messages/${roomId}`);
            setMessages(response?.messageData);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const response = await apiService.post<PostResponseData>(`/messages/${roomId}`, {
                content: newMessage
            });
            setMessages(prev => [...prev, response?.content]);
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const navigateToRoom = (roomId: string) => {
        navigate(`/room/${roomId}`);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Left Navigation */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">My Rooms</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {rooms.joined.map((room) => (
                        <div
                            key={room.id}
                            onClick={() => navigateToRoom(room.id)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 ${
                                room.id === roomId ? "bg-blue-50 border-l-4 border-blue-500" : ""
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="material-symbols-rounded text-gray-500 mr-2">
                                        {room.isPrivate ? "lock" : "group"}
                                    </span>
                                    <span className="font-medium text-gray-800">{room.name}</span>
                                </div>
                                {room.unreadMessages && room.unreadMessages > 0 && (
                                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                                        {room.unreadMessages}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 truncate">{room.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                    <h1 className="text-xl font-semibold text-gray-800">
                        {rooms.joined.find(room => room.id === roomId)?.name || "Room Chat"}
                    </h1>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${
                                    message.senderId === "current-user" ? "justify-end" : "justify-start"
                                }`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-3 ${
                                        message.senderId === "current-user"
                                            ? "bg-blue-500 text-white"
                                            : "bg-white text-gray-800"
                                    }`}
                                >
                                    <div className="text-sm font-medium mb-1">
                                        {message.senderName}
                                    </div>
                                    <div className="text-sm">{message.content}</div>
                                    <div className="text-xs mt-1 opacity-70">
                                        {new Date(message?.createdAt || message?.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
                    <div className="flex space-x-4">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoomChatPage;
