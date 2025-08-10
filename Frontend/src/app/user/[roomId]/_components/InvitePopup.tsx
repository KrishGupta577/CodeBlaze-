import { useState } from 'react';
import { Users, Copy, Check, Share2, X } from 'lucide-react';

const InviteSection = ({ roomId, setShowPopup }: { roomId: string, setShowPopup: (isOpen: boolean) => void }) => {
    const [copied, setCopied] = useState(false);


    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join my room',
                    text: `Join my room using this ID: ${roomId}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            handleCopyRoomId();
        }
    };

    return (
        <div className="p-3 border-t border-gray-700 relative">
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900 rounded-md shadow-lg p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-gray-100 font-medium">Invite People</h4>
                    <button
                        onClick={() => setShowPopup(false)}
                        className="text-gray-400 hover:text-gray-200"
                    >
                        <X size={16} />
                    </button>
                </div>

                <p className="text-gray-300 text-sm mb-3">Share this room ID with people you want to invite:</p>

                <div className="flex rounded-md overflow-hidden mb-4">
                    <div className="bg-gray-800 text-gray-300 px-3 py-2 flex-1 text-sm font-mono">
                        {roomId}
                    </div>
                    <button
                        className="bg-gray-700 hover:bg-gray-600 px-3 flex items-center text-gray-200"
                        onClick={handleCopyRoomId}
                    >
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                </div>

                <button
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors flex items-center justify-center"
                    onClick={handleShare}
                >
                    <Share2 size={16} className="mr-1.5" />
                    Share Invite
                </button>
            </div>

        </div>
    );
};

export default InviteSection;               