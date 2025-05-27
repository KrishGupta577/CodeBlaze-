"use client"
import { useState } from "react";
import EditorPanel from "./_components/EditorPanel";
import Header from "./_components/Header";
import OutputPanel from "./_components/OutputPanel";
import SidePanel from "./_components/SidePanel";
import { SignedIn } from "@clerk/nextjs";
import RunButton from "./_components/RunButton";
import { Users } from "lucide-react";

const Page = () => {
    const [activeTab, setActiveTab] = useState("editor");
    const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

    const togglePanel = () => {
        setIsPanelOpen(!isPanelOpen);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <div className="max-w-[1800px] w-full mx-auto p-4 md:p-6">
                <Header />

                {/* Main Tab Navigation with improved spacing and visual separation */}
                <div className="flex items-center mb-6 border-b border-gray-700/70 pb-1">
                    <div className="flex gap-2">
                        <button
                            className={`px-6 py-2.5 font-medium rounded-t-lg transition-colors ${activeTab === "editor"
                                ? "text-blue-400 border-b-2 border-blue-400 bg-gray-800/40"
                                : "text-gray-400 hover:text-blue-300 hover:bg-gray-800/20"
                                }`}
                            onClick={() => setActiveTab("editor")}
                        >
                            Editor
                        </button>
                        <button
                            className={`px-6 py-2.5 font-medium rounded-t-lg transition-colors ${activeTab === "output"
                                ? "text-blue-400 border-b-2 border-blue-400 bg-gray-800/40"
                                : "text-gray-400 hover:text-blue-300 hover:bg-gray-800/20"
                                }`}
                            onClick={() => setActiveTab("output")}
                        >
                            Output
                        </button>
                    </div>
                    <div className="flex justify-end flex-grow gap-2">
                        <button
                            className={`px-3 py-2 font-medium rounded-lg transition-colors flex items-center
                                ${isPanelOpen
                                    ? "text-blue-400 bg-gray-800/60"
                                    : "text-gray-400 hover:text-blue-300 hover:bg-gray-800/40"}`}
                            onClick={togglePanel}
                        >
                            <Users size={18} className="mr-1" />
                            <span className="hidden sm:inline">Participants</span>
                            <span className="inline sm:hidden">Users</span>
                        </button>
                        <SignedIn>
                            <RunButton setActiveTab={setActiveTab} />
                        </SignedIn>
                    </div>
                </div>

                {/* Content panels with grid layout */}
                <div className="flex gap-4">
                    <div className={`${isPanelOpen ? 'w-3/4' : 'w-full'} transition-all duration-300`}>
                        {activeTab === "editor" && (
                            <div className="h-[calc(100vh-16rem)] rounded-lg shadow-lg shadow-black/30 border border-gray-700/50">
                                <EditorPanel />
                            </div>
                        )}

                        {activeTab === "output" && (
                            <div className="h-[calc(100vh-16rem)] rounded-lg shadow-lg shadow-black/30 border border-gray-700/50">
                                <OutputPanel />
                            </div> 
                        )}
                    </div>
                    {isPanelOpen && (
                        <div className="w-1/4 max-w-xs">
                            <div className="h-[calc(100vh-16rem)] rounded-lg shadow-lg shadow-black/30 border border-gray-700/50">
                                <SidePanel isOpen={true} setIsOpen={setIsPanelOpen} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Page;