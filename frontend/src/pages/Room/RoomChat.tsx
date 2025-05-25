import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useChatContext } from "../../context/ChatContext";
import { useRoom } from "../../context/RoomContext";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../utils/api";
import RoomSettingsModal from "../../components/RoomSettings/RoomSettingsModal";
import { useWebSocket } from "../../services/websocketService";

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
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleWebSocketMessage = (message: any) => {
        if (message.type === 'message') {
            if (message.userId !== user?.id) {
                const messageExists = messages.some(m => m.id === message.metadata?.messageId);
                if (!messageExists) {
                    setMessages(prev => [...prev, {
                        id: message.metadata?.messageId || Date.now().toString(),
                        content: message.content,
                        senderId: message.userId,
                        senderName: message.metadata?.userName || 'Unknown User',
                        timestamp: message.timestamp,
                        createdAt: message.timestamp
                    }]);
                }
            }
        }
    };

    const { sendMessage } = useWebSocket(roomId || '', handleWebSocketMessage);

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
            // Send message through WebSocket
            sendMessage({
                type: 'message',
                roomId: roomId || '',
                userId: user?.id || '',
                content: newMessage,
                metadata: {
                    userName: user ? `${user.firstname} ${user.lastname}` : 'Unknown User',
                    messageId: Date.now().toString()
                }
            });

            // Also send through REST API for persistence
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

    const handleStartVideoChat = () => {
        // TODO: Implement video chat functionality
        console.log("Starting video chat...");
    };

    const handleStartAudioChat = () => {
        // TODO: Implement audio chat functionality
        console.log("Starting audio chat...");
    };

    const handleOpenSettings = () => {
        setIsSettingsOpen(true);
    };

    const handleCloseSettings = () => {
        setIsSettingsOpen(false);
    };

    const handleSaveSettings = async (settings: {
        name: string;
        description: string;
        isPrivate: boolean;
    }) => {
        try {
            await apiService.put(`/rooms/${roomId}`, settings);
            
            // Update local state
            const updatedRooms = rooms.joined.map(room => 
                room.id === roomId 
                    ? { ...room, ...settings }
                    : room
            );
            
            updateRooms({
                ...rooms,
                joined: updatedRooms
            });
        } catch (error) {
            console.error("Failed to update room settings:", error);
        }
    };

    const currentRoom = rooms.joined.find(room => room.id === roomId);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Left Navigation */}
            <div className="w-md bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-gray-800">My Rooms</h2>
                        <span className="material-symbols-rounded text-gray-500 cursor-pointer hover:text-gray-700" role="button" onClick={() => navigate("/room/create")}>
                            add_circle
                        </span>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search rooms..."
                            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="material-symbols-rounded absolute left-3 top-2.5 text-gray-400">
                            search
                        </span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {rooms.joined.map((room) => (
                        <div
                            key={room.id}
                            onClick={() => navigateToRoom(room.id)}
                            className={`p-4 cursor-pointer border-y last:border-b-0 border-l-4 transition-all duration-200 ${
                                room.id === roomId 
                                    ? "bg-blue-50 border-blue-500" 
                                    : "border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${
                                        room.isPrivate 
                                            ? "bg-purple-100 text-purple-600" 
                                            : "bg-blue-100 text-blue-600"
                                    }`}>
                                        <span className="material-symbols-rounded text-xl">
                                            {room.isPrivate ? "lock" : "group"}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-800">{room.name}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-[150px]">
                                            {room.description}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    {room.unreadMessages && room.unreadMessages > 0 && (
                                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 mb-1">
                                            {room.unreadMessages}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400">
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-lg ${
                                    currentRoom?.isPrivate 
                                        ? "bg-purple-100 text-purple-600" 
                                        : "bg-blue-100 text-blue-600"
                                }`}>
                                    <span className="material-symbols-rounded text-xl">
                                        {currentRoom?.isPrivate ? "lock" : "group"}
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-800">
                                        {currentRoom?.name || "Room Chat"}
                                    </h1>
                                    <p className="text-sm text-gray-500">
                                        {currentRoom?.description || "No description available"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleStartAudioChat}
                                    className="flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    <span className="material-symbols-rounded mr-2">mic</span>
                                    <span>Audio Chat</span>
                                </button>
                                <button
                                    onClick={handleStartVideoChat}
                                    className="flex items-center px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                >
                                    <span className="material-symbols-rounded mr-2">videocam</span>
                                    <span>Video Chat</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                    <span className="material-symbols-rounded text-base mr-1">group</span>
                                    {currentRoom?.membersCount || 0} members
                                </span>
                                <span className="flex items-center">
                                    <span className="material-symbols-rounded text-base mr-1">schedule</span>
                                    Created {currentRoom?.createdAt 
                                        ? new Date(currentRoom.createdAt).toLocaleDateString()
                                        : 'Recently'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={handleOpenSettings}
                                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <span className="material-symbols-rounded">settings</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Modal */}
                <RoomSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={handleCloseSettings}
                    room={currentRoom}
                    onSave={handleSaveSettings}
                />

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className="p-4 rounded-full bg-blue-100 mb-4">
                                <span className="material-symbols-rounded text-4xl text-blue-500">chat</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No messages yet</h3>
                            <p className="text-gray-500 max-w-md">
                                Be the first to start the conversation! Type a message below to begin chatting with others in this room.
                            </p>
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
                                    className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
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
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                        >
                            <span className="material-symbols-rounded mr-2">send</span>
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoomChatPage;
