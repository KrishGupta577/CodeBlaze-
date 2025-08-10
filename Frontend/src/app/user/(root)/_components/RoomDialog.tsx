import { useState, useEffect } from "react";
import { X, Users, Copy, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { api } from "../../../../../convex/_generated/api";
import { useMutation } from "convex/react";

const RoomDialog = ({ setShowRoomPopUp }: { setShowRoomPopUp: React.Dispatch<React.SetStateAction<boolean>> }) => {
    const [activeTab, setActiveTab] = useState("create");
    const [roomId, setRoomId] = useState("");
    const [userName, setUserName] = useState("");
    const [joinRoomId, setJoinRoomId] = useState("");
    const [joinUserName, setJoinUserName] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const router = useRouter()
    const createRoom = useMutation(api.room.createRoom);
    const addParticipants = useMutation(api.room.addParticipant);
    const { userId } = useAuth()

    console.log(userId)

    // Generate a random room ID on mount
    useEffect(() => {
        const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
        setRoomId(randomId);

        // Get saved username if available
        const savedName = localStorage.getItem("code-room-username");
        if (savedName) {
            setUserName(savedName);
            setJoinUserName(savedName);
        }
    }, []);

    const handleCreateRoom = async () => {
        try {
            if (userName.trim()) {
                if (!userId) {
                    toast.error("Error occured in Joining room, Please try later.")
                }
                setShowRoomPopUp(false);
                router.push(`/user/${roomId}?username=${userName}`);

                const response = await createRoom({ name: userName || "Host", roomId, userId: userId ?? '' })
                toast.success(response.message)
            }
        } catch (error) {
            console.log("Error occured :", error)
            toast.error("Error occured in Joining room, Please try later.")
        }
    };

    const handleJoinRoom = async () => {
        if (joinRoomId.trim() && joinUserName.trim()) {
            try {
                if (!userId) {
                    toast.error("Error occured in Joining room, Please try later.")
                }
                router.push(`/user/${joinRoomId}?username=${joinUserName}`);
                setShowRoomPopUp(false);

                const response = await addParticipants({ name: joinUserName || "Unknown User", roomId: joinRoomId, participantId: userId ?? '' })
                toast.success(response.message)
            } catch (error) {
                console.log("Error occured :", error)
                toast.error("Error occured in Joining room, Please try later.")
            }
        }
    };

    const copyRoomId = async () => {
        await navigator.clipboard.writeText(roomId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay that covers the entire screen */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
            {/* Dialog content */}
            <div className="relative z-10 bg-[#12121a] rounded-xl border border-white/[0.05] p-8 w-full max-w-md transition-all duration-200">
                <SignedIn>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e1e2e] ring-1 ring-white/5">
                                <Users className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-semibold text-white">Room Options</h2>
                        </div>
                        <button
                            onClick={() => setShowRoomPopUp(false)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#1e1e2e] text-gray-400 hover:text-gray-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex mb-6 bg-[#1e1e2e] rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab("create")}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === "create"
                                ? "bg-blue-500 text-white"
                                : "text-gray-400 hover:text-gray-300"
                                }`}
                        >
                            Create Room
                        </button>
                        <button
                            onClick={() => setActiveTab("join")}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === "join"
                                ? "bg-blue-500 text-white"
                                : "text-gray-400 hover:text-gray-300"
                                }`}
                        >
                            Join Room
                        </button>
                    </div>

                    {/* Create Room Form */}
                    {activeTab === "create" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Room ID</label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={roomId}
                                        readOnly
                                        className="flex-1 bg-[#1e1e2e] border border-white/10 rounded-l-lg px-3 py-2 text-white text-sm"
                                    />
                                    <button
                                        onClick={copyRoomId}
                                        className="bg-[#2a2a3a] border border-white/10 border-l-0 rounded-r-lg px-3 flex items-center justify-center"
                                    >
                                        {isCopied ? (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Your Name</label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-[#1e1e2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                />
                            </div>

                            <button
                                onClick={handleCreateRoom}
                                disabled={!userName.trim()}
                                className={`w-full px-4 py-3 mt-2 rounded-lg font-medium transition-all ${userName.trim()
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-[#1e1e2e] text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                Create & Join
                            </button>
                        </div>
                    )}

                    {/* Join Room Form */}
                    {activeTab === "join" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Room ID</label>
                                <input
                                    type="text"
                                    value={joinRoomId}
                                    onChange={(e) => setJoinRoomId(e.target.value)}
                                    placeholder="Enter room ID"
                                    className="w-full bg-[#1e1e2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Your Name</label>
                                <input
                                    type="text"
                                    value={joinUserName}
                                    onChange={(e) => setJoinUserName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-[#1e1e2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                />
                            </div>

                            <button
                                onClick={handleJoinRoom}
                                disabled={!joinRoomId.trim() || !joinUserName.trim()}
                                className={`w-full px-4 py-3 mt-2 rounded-lg font-medium transition-all ${joinRoomId.trim() && joinUserName.trim()
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-[#1e1e2e] text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                Join Room
                            </button>
                        </div>
                    )}
                </SignedIn>
                <SignedOut>
                    <div className="flex flex-col items-center justify-center space-y-4 py-6">
                        <div className="flex items-center justify-between w-full mb-2">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e1e2e] ring-1 ring-white/5">
                                    <Users className="w-5 h-5 text-blue-500" />
                                </div>
                                <h2 className="text-xl font-semibold text-white">Room Access</h2>
                            </div>
                            <button
                                onClick={() => setShowRoomPopUp(false)}
                                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#1e1e2e] text-gray-400 hover:text-gray-300 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-center space-y-3 px-4">
                            <p className="text-gray-300">You need to sign in to create or join a room.</p>
                            <SignInButton mode="modal">
                                <button className="px-4 py-3 w-full rounded-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all">
                                    Sign In
                                </button>
                            </SignInButton>
                        </div>
                    </div>
                </SignedOut>
            </div>

        </div >
    );
};

export default RoomDialog;