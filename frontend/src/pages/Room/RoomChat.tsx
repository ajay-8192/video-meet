import { useParams } from "react-router-dom";

const RoomChatPage: React.FC = () => {

    const { roomId } = useParams();

    return (
        <div>
            RoomChatPage: {roomId}
        </div>
    )
};

export default RoomChatPage;
