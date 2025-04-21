import useProvideGoPost from "./useProviderGoPost"

const useRoomAPIRequest = () => {
    const { loading, error, data } = useProvideGoPost();

    const handleJoinRoom = (roomId: string) => {
        console.log('===> ', { roomId });
        
    };

    const handleLeaveRoom = (roomId: string) => {
        console.log('===> ', { roomId });
    };

    const handleAcceptInvite = (roomId: string) => {
        console.log('===> ', { roomId });
    };

    const handleDeclineInvite = (roomId: string) => {
        console.log('===> ', { roomId });
    };

    const handleCancelRequest = (roomId: string) => {
        console.log('===> ', { roomId });
    };

    return {
        loading,
        error,
        data,
        handleAcceptInvite,
        handleDeclineInvite,
        handleCancelRequest,
        handleJoinRoom,
        handleLeaveRoom
    };
}

export default useRoomAPIRequest;