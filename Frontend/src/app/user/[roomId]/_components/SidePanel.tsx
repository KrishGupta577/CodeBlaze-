"use client";
import { useEffect, useRef, useState } from "react";
import { Ban, User, Users, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import InviteSection from "./InvitePopup";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { Socket } from "socket.io-client";

interface SidePanelProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

interface Participant {
    userId: string;
    name: string;
    status: string;
    isHost?: boolean;
}

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, setIsOpen }) => {
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const params = useParams();
    const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId ?? "";
    const { userId } = useAuth();
    const getRoom = useQuery(api.room.getRoom, { roomId });
    const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);

    useEffect(() => {
        if (getRoom?.participants) {
            const formattedParticipants: Participant[] = getRoom.participants.map(p => ({
                userId: p.userId,
                name: p.name,
                status: p.status,
            }));
            setParticipants(formattedParticipants);
        }

        if (getRoom?.host.userId === userId) {
            setIsHost(true);
        }
    }, [getRoom]);

    const disconnectParticipant = async (userId: string) => {

    }

    if (!getRoom || !getRoom.host) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <div className="w-10 h-10 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500">Loading, please wait...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-800 rounded-lg">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center">
                    <Users size={18} className="text-blue-400 mr-2" />
                    <h3 className="font-medium text-gray-100">Participants</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-gray-700 text-xs text-gray-300 px-2 py-1 rounded-full">
                        {participants.length}
                    </span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-gray-200"
                        aria-label="Close panel"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <ul className="p-2">
                    <li className="mb-2 last:mb-0">
                        <div className="flex items-center p-2 hover:bg-gray-700/50 rounded-md transition-colors">
                            <div className="relative mr-3">
                                <User />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-100">{getRoom.host.name || "Host"}</span>
                                    <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                                        Host
                                    </span>
                                </div>
                            </div>
                        </div>
                    </li>

                    {participants.map((user) => (
                        <li key={user.userId} className="mb-2 last:mb-0">
                            <div
                                className="relative flex items-center p-2 hover:bg-gray-700/50 rounded-md transition-colors cursor-pointer"
                                onClick={() => {
                                    // Only show options for the host
                                    console.log(isHost)
                                    if (isHost) {
                                        setSelectedUser(selectedUser === user.userId ? null : user.userId);
                                    }
                                }}
                            >
                                <div className="relative mr-3">
                                    <User />
                                    <span
                                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${user.status === 'connected' ? 'bg-green-500' :
                                            user.status === 'disconnected' ? 'bg-yellow-500' : 'bg-gray-500'
                                            }`}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        <span className="text-sm font-medium text-gray-100">{user.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 capitalize">{user.status}</span>
                                </div>

                                {/* Dropdown options - only visible for host and when user is selected */}
                                {isHost && selectedUser === user.userId && (
                                    <div className="absolute right-2 top-full mt-1 bg-gray-900 rounded-md shadow-lg z-10 w-32 overflow-hidden">
                                        <button
                                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors flex items-center"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedUser(null);
                                                disconnectParticipant(user.userId)
                                            }}
                                        >
                                            <Ban size={14} className="mr-2" />
                                            Disconnect
                                        </button>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-3 border-t border-gray-700">
                <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center" onClick={() => setShowPopup(true)}>
                    <Users size={16} className="mr-1.5" />
                    Invite People
                </button>
            </div>
            {showPopup && <InviteSection roomId={roomId} setShowPopup={setShowPopup} />}
        </div>
    );
};

export default SidePanel;
