export const BASE_URL = "http://localhost:8080/api"

export const construct_api_urls = {
    // Auth APIs
    register: () => BASE_URL + "/register",
    sendOTP: () => BASE_URL + "/send-otp",
    verifyAccount: () => BASE_URL + "/verify-account",
    verifyOTP: () => BASE_URL + "/verify-otp",
    userDetails: () => BASE_URL + "/user",
    deleteUser: () => BASE_URL + "/delete-account",

    // Room APIS
    createRoom: () => BASE_URL + "/rooms/create",
    listRooms: () => BASE_URL + "/rooms",
    roomDetails: (roomId: string) => BASE_URL + `/rooms/${roomId}`,
    joinRoom: (roomId: string) => BASE_URL + `/rooms/${roomId}/join`,
    leaveRoom: (roomId: string) => BASE_URL + `/rooms/${roomId}/leave`,
    inviteRoom: (roomId: string) => BASE_URL + `/rooms/${roomId}/invite`,
}

