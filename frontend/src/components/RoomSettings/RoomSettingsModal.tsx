import React from 'react';
import { RoomType } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';

interface RoomSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    room: RoomType | undefined;
    onSave: (settings: {
        name: string;
        description: string;
        isPrivate: boolean;
    }) => Promise<void>;
}

interface RoomSettings {
    isEditing: boolean;
    name: string;
    description: string;
    isPrivate: boolean;
}

const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
    isOpen,
    onClose,
    room,
    onSave
}) => {
    const [settings, setSettings] = React.useState<RoomSettings>({
        isEditing: false,
        name: room?.name || "",
        description: room?.description || "",
        isPrivate: room?.isPrivate || false
    });

    const { user } = useAuth();

    React.useEffect(() => {
        if (room) {
            setSettings({
                isEditing: false,
                name: room.name,
                description: room.description || "",
                isPrivate: room.isPrivate
            });
        }
    }, [room]);

    const handleEditSettings = () => {
        setSettings(prev => ({ ...prev, isEditing: true }));
    };

    const handleSaveSettings = async () => {
        await onSave({
            name: settings.name,
            description: settings.description,
            isPrivate: settings.isPrivate
        });
        setSettings(prev => ({ ...prev, isEditing: false }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-4">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Room Settings</h2>
                        <button 
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-gray-100"
                        >
                            <span className="material-symbols-rounded">close</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Room Name
                            </label>
                            {settings.isEditing ? (
                                <input
                                    type="text"
                                    value={settings.name}
                                    onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            ) : (
                                <p className="text-gray-800">{settings.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            {settings.isEditing ? (
                                <textarea
                                    value={settings.description}
                                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows={3}
                                />
                            ) : (
                                <p className="text-gray-800">{settings.description || "No description"}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Room Type
                            </label>
                            {settings.isEditing ? (
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={!settings.isPrivate}
                                            onChange={() => setSettings(prev => ({ ...prev, isPrivate: false }))}
                                            className="mr-2"
                                        />
                                        Public
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={settings.isPrivate}
                                            onChange={() => setSettings(prev => ({ ...prev, isPrivate: true }))}
                                            className="mr-2"
                                        />
                                        Private
                                    </label>
                                </div>
                            ) : (
                                <p className="text-gray-800">
                                    {settings.isPrivate ? "Private Room" : "Public Room"}
                                </p>
                            )}
                        </div>

                        {room?.createdBy === user?.id && (
                            <div className="flex justify-end space-x-3 pt-4">
                                {settings.isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setSettings(prev => ({ ...prev, isEditing: false }))}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveSettings}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            Save Changes
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleEditSettings}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        Edit Room
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomSettingsModal; 