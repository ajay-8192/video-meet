type RoomSectionProps = {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode[];
    emptyMessage: string;
};

const RoomSection: React.FC<RoomSectionProps> = ({ title, icon, children, emptyMessage }) => {
    return (
        <div className="mb-8">
            <div className="flex items-center mb-4">
                {icon}
                <h2 className="text-lg font-semibold ml-2">{title}</h2>
            </div>
            {children.length > 0 ? (
                children
            ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                {emptyMessage}
                </div>
            )}
        </div>
    );
};

export default RoomSection;
