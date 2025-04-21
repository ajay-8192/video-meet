import { useNavigate } from "react-router-dom";
import useRoomAPIRequest from "../hooks/useRoomAPIRequest";
import { formatToLocalDDMMYYHM } from "../utils/helper";

type RoomProps = {
    room: any;
    type: "my" | "request" | "invited" | "public";
};

const Room: React.FC<RoomProps> = ({ room, type }) => {

    const navigate = useNavigate();
    const { handleAcceptInvite, handleDeclineInvite, handleJoinRoom, handleCancelRequest } = useRoomAPIRequest();

    const navigateToRoom = () => {
        navigate(`/room/${room.id}`);
        return;
    };

    const acceptInvite = (e: any, roomId: string) => {
        e.stopPropagation();
        alert(`Accepted invite to room ${roomId}`);
        handleAcceptInvite(roomId);
        // In a real app, call an API to accept the invitation
    };

    const declineInvite = (e: any, roomId: string) => {
        e.stopPropagation();
        alert(`Declined invite to room ${roomId}`);
        handleDeclineInvite(roomId);
        // In a real app, call an API to decline the invitation
    };

    const joinRoom = (e: any, roomId: string) => {
        e.stopPropagation();
        alert(`Joining room ${roomId}`);
        handleJoinRoom(roomId);
        // In a real app, call an API to join the room
    };

    const cancelRequest = (e: any, roomId: string) => {
        e.stopPropagation();
        alert(`Cancelled request to join room ${roomId}`);
        // In a real app, call an API to cancel the join request
        handleCancelRequest(roomId);
    };

    return (
        <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer"
            onClick={navigateToRoom}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center">
                        <h3 className="font-medium text-gray-900">{room.name}</h3>

                        {room.isPrivate ? (
                            <span className="material-symbols-rounded ml-2 !text-[14px] text-gray-500">
                                lock
                            </span>
                        ) : null}
                        {room?.unreadMessages > 0 && (
                            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                                {room.unreadMessages}
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-500 mt-1">{room.description}</p>

                    <div className="flex items-center mt-2 text-xs text-gray-500">
                        <div className="flex items-center mr-4">
                            <span className="material-symbols-rounded !text-[14px] mr-1">
                                group
                            </span>
                            {room.membersCount} participants
                        </div>

                        {type === 'my' && room.lastActive && (
                            <div>Active {room.lastActive}</div>
                        )}

                        {type === 'invited' && (
                            <div>Invited by {room.InvitedByName || room.InvitedByEmail} • {formatToLocalDDMMYYHM(room.createdAt)}</div>
                        )}

                        {type === 'request' && (
                            <div>Requested {room.requestedAt}</div>
                        )}
                    </div>
                </div>

                <div className="flex">
                    {type === 'my' && (
                        <span className="material-symbols-rounded text-gray-400">
                            chevron_right
                        </span>
                    )}

                    {type === 'invited' && (
                        <div className="flex space-x-2">
                            <button
                                onClick={(e) => declineInvite(e, room.id)}
                                className="text-gray-500 hover:text-gray-700 text-sm border border-gray-300 rounded px-2 py-1"
                            >
                                Decline
                            </button>
                            <button
                                onClick={(e) => acceptInvite(e, room.id)}
                                className="bg-blue-500 text-white text-sm rounded px-3 py-1 hover:bg-blue-600"
                            >
                                Accept
                            </button>
                        </div>
                    )}

                    {type === 'request' && (
                        <button
                            onClick={(e) => cancelRequest(e, room.id)}
                            className="text-gray-500 hover:text-gray-700 text-sm border border-gray-300 rounded px-3 py-1"
                        >
                            Cancel
                        </button>
                    )}

                    {type === 'public' && (
                        <button
                            onClick={(e) => joinRoom(e, room.id)}
                            className="bg-blue-500 text-white text-sm rounded px-3 py-1 hover:bg-blue-600 flex items-center"
                        >
                            <span className="material-symbols-rounded !text-[14px] mr-1">
                                person_add
                            </span>
                            Join
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Room;
