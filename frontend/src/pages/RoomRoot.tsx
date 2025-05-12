import { RoomProvider } from "../context/RoomContext";
import AuthRoot from "./AuthRoot";

const RoomRoot: React.FC = () => {
    return (
        <RoomProvider>
            <AuthRoot />
        </RoomProvider>
    );
};

export default RoomRoot;
