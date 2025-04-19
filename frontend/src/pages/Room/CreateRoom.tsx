import { useEffect, useState } from 'react';
import useApiRequest from '../../hooks/useAPIRequest';
import { construct_api_urls } from '../../constants/api';
import { useRoom } from '../../context/RoomContext';
import { useNavigate } from 'react-router-dom';

export default function CreateRoom() {
    const [formData, setFormData] = useState({
        roomName: '',
        description: '',
        isPrivate: false,
        maxUsers: 10,
        passwordProtected: false,
        password: '',
        showPassword: false
    });

    const [inviteEmail, setInviteEmail] = useState('');
    const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
    const [inviteError, setInviteError] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);

    const navigate = useNavigate();
    const { rooms, updateRooms, updateSelectedRoom } = useRoom();
    const { loading, error, data, refetch: createRoom } = useApiRequest(construct_api_urls.createRoom())

    useEffect(() => {
        if (data?.room) {
            const id = data.room.id;
            const link = location.host + `/room/${id}`;
            setInviteLink(link);
            const newRooms = [...rooms, data.room]
            updateRooms(newRooms);
            updateSelectedRoom(id);
        }
    }, [data])

    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });

        // If turning off private mode, clear the validation error if it exists
        if (name === 'isPrivate' && !checked) {
            setInviteError('');
        }
    };

    const addInvitedUser = () => {
        if (!inviteEmail) return;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail)) {
            setInviteError('Please enter a valid email address');
            return;
        }

        // Check if email already in the list
        if (invitedUsers.includes(inviteEmail)) {
            setInviteError('This user has already been invited');
            return;
        }

        setInvitedUsers([...invitedUsers, inviteEmail]);
        setInviteEmail('');
        setInviteError('');
    };

    const removeInvitedUser = (emailToRemove: string) => {
        setInvitedUsers(invitedUsers.filter(email => email !== emailToRemove));
    };

    const handleCreateRoom = () => {
        if (!formData.roomName) return;

        // Validate: if private, must have at least one invited user
        if (formData.isPrivate && invitedUsers.length === 0) {
            setInviteError('Please invite at least one user for a private room');
            return;
        }

        const payload = {
            name: formData.roomName,
            description: formData.description,
            isPrivate: formData.isPrivate,
            maxUsers: formData.maxUsers,
            inviteUsers: formData.isPrivate ? invitedUsers : undefined,
            password: formData.passwordProtected ? formData.password : undefined
        }

        createRoom(construct_api_urls.createRoom(), {
            method: "POST",
            credentials: "include",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // In a real app, this would make an API call to create the room
        // For now, we'll just generate a fake invite link
        const generatedLink = `videochat.example.com/join/${Math.random().toString(36).substring(2, 8)}`;
        // setInviteLink(generatedLink);
        console.log(generatedLink);
    };

    const handleJoinRoom = () => {
        navigate(inviteLink)
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const togglePasswordVisibility = () => {
        setFormData({
            ...formData,
            showPassword: !formData.showPassword
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-center mb-6">Create a Room</h1>

                {!inviteLink ? (
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                                Room Name*
                            </label>
                            <input
                                id="roomName"
                                name="roomName"
                                type="text"
                                value={formData.roomName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="My Meeting Room"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="What's this room about?"
                            ></textarea>
                        </div>

                        <div className="flex justify-between gap-4">
                            <div className="flex-1">
                                <label htmlFor="maxUsers" className="block text-sm font-medium text-gray-700 mb-1">
                                    Max Users
                                </label>
                                <input
                                    id="maxUsers"
                                    name="maxUsers"
                                    type="number"
                                    min="2"
                                    max="50"
                                    value={formData.maxUsers}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Available Features</label>
                                <div className="flex justify-between items-center p-2 border border-gray-300 rounded-md bg-gray-50">
                                    <div className="flex items-center text-blue-600">
                                        <span className="material-symbols-rounded">
                                            videocam
                                        </span>
                                    </div>
                                    <div className="flex items-center text-blue-600">
                                        <span className="material-symbols-rounded">
                                            mic
                                        </span>
                                    </div>
                                    <div className="flex items-center text-blue-600">
                                    <span className="material-symbols-rounded">
                                        chat_bubble
                                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center">
                                <input
                                    id="isPrivate"
                                    name="isPrivate"
                                    type="checkbox"
                                    checked={formData.isPrivate}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
                                    Make room private (invite only)
                                </label>
                            </div>

                            {formData.isPrivate && (
                                <div className="pl-6 pb-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Invite Users*
                                    </label>
                                    <div className="flex">
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="user@example.com"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={addInvitedUser}
                                            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                                        >
                                            <span className="material-symbols-rounded">
                                                add
                                            </span>
                                        </button>
                                    </div>

                                    {inviteError && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <span className="material-symbols-rounded">
                                                info
                                            </span>
                                            {inviteError}
                                        </p>
                                    )}

                                    {invitedUsers.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500 mb-1">Invited users:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {invitedUsers.map((email, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center bg-blue-50 text-blue-700 text-sm px-2 py-1 rounded-md"
                                                    >
                                                        <span className="mr-1">{email}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeInvitedUser(email)}
                                                            className="text-blue-700 hover:text-blue-900"
                                                        >
                                                            <span className="material-symbols-rounded">
                                                                close
                                                            </span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center">
                                <input
                                    id="passwordProtected"
                                    name="passwordProtected"
                                    type="checkbox"
                                    checked={formData.passwordProtected}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="passwordProtected" className="ml-2 block text-sm text-gray-700">
                                    Password protected
                                </label>
                            </div>

                            {formData.passwordProtected && (
                                <div className="pl-6">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Room Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={formData.showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter password"
                                            required={formData.passwordProtected}
                                        />
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
                                        >
                                            {formData.showPassword ? (
                                                <span className="material-symbols-rounded">
                                                    visibility_off
                                                </span>
                                            ) : (
                                                <span className="material-symbols-rounded">
                                                    visibility
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            disabled={loading || Boolean(error)}
                            onClick={handleCreateRoom}
                            className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Create Room
                            <span className="material-symbols-rounded">
                                arrow_right_alt
                            </span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-center p-4 bg-green-50 text-green-700 rounded-md">
                            <span className="material-symbols-rounded">
                                check
                            </span>
                            <span>Room created successfully!</span>
                        </div>

                        <div>
                            <div className="text-sm text-gray-600 mb-3">
                                <p className="font-semibold">{formData.roomName}</p>
                                {formData.description && <p className="mt-1">{formData.description}</p>}
                                <div className="mt-2 flex gap-4">
                                    <span className="flex items-center">
                                    <span className="material-symbols-rounded">
                                        person
                                    </span>
                                        Max: {formData.maxUsers}
                                    </span>
                                    {formData.isPrivate && (
                                        <span className="flex items-center text-orange-600">
                                            <span className="material-symbols-rounded">
                                                group
                                            </span>
                                            Private
                                        </span>
                                    )}
                                    {formData.passwordProtected && (
                                        <span className="flex items-center text-blue-600">
                                            <span className="material-symbols-rounded">
                                                lock
                                            </span>
                                            Protected
                                        </span>
                                    )}
                                </div>
                            </div>

                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Invite Link
                            </label>
                            <div className="flex mt-1">
                                <input
                                    type="text"
                                    readOnly
                                    value={inviteLink}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={copyInviteLink}
                                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                                >
                                    {linkCopied ? 'Copied!' : (
                                        <span className="material-symbols-rounded">
                                            content_copy
                                        </span>
                                    )}
                                </button>
                            </div>

                            {formData.passwordProtected && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Remember to share the password with invited users: <strong>{formData.password}</strong>
                                </p>
                            )}

                            {formData.isPrivate && invitedUsers.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm font-medium text-gray-700">Invited users:</p>
                                    <div className="mt-1 text-sm text-gray-600">
                                        {invitedUsers.map((email, index) => (
                                            <div key={index} className="flex items-center">
                                                    <span className="material-symbols-rounded">
                                                        check
                                                    </span>
                                                <span>{email}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600">
                                        Invitations have been sent to these users.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => setInviteLink('')}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Create Another Room
                            </button>
                            <button
                                type="button"
                                onClick={handleJoinRoom}
                                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Join Now
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}