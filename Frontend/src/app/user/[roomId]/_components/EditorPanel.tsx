"use client";
import { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle, Copy, RotateCcwIcon, TypeIcon } from "lucide-react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import useMounted from "@/hooks/useMounted";
import { defineMonacoThemes, LANGUAGE_CONFIG } from "../_constants";
import { EditorPanelSkeleton } from "./EditorPanelSkeliton";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { initSocket } from "@/utils/socket";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { ACTIONS } from "@/utils/Actions";
import toast from "react-hot-toast";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

interface JoinedEventData {
  clients: any[];
  userId: string;
  socketId: string;
}

interface DisconnectedEventData {
  socketId: string;
  userId: string;
}

interface CodeSyncEventData {
  code: string;
}

function EditorPanel() {
  const clerk = useClerk();
  const { language, theme, fontSize, editor, setFontSize, setEditor } = useCodeEditorStore();
  const [code, setCode] = useState("// Write your code here");
  const params = useParams();
  const mounted = useMounted();
  const router = useRouter();
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);
  const removeParticipant = useMutation(api.room.deleteParticipant);
  const { user } = useUser();
  
  // Add a ref to prevent infinite loops during sync
  const isReceivingCodeRef = useRef(false);

  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setIsCopied(true);

    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    const savedCode = localStorage.getItem(`editor-code-${language}`);
    const newCode = savedCode || LANGUAGE_CONFIG[language].defaultCode;
    if (editor) editor.setValue(newCode);
    setCode(newCode);
  }, [language, editor]);

  useEffect(() => {
    const savedFontSize = localStorage.getItem("editor-font-size");
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
  }, [setFontSize]);

  const handleRefresh = () => {
    const defaultCode = LANGUAGE_CONFIG[language].defaultCode;
    if (editor) editor.setValue(defaultCode);
    localStorage.removeItem(`editor-code-${language}`);
    setCode(defaultCode);
  };

  const handleEditorChange = (value: string | undefined) => {
    // Don't emit changes if we're currently receiving code from socket
    if (isReceivingCodeRef.current) {
      return;
    }

    const codeValue = value || "";
    setCode(codeValue);
    
    // Save to localStorage
    if (codeValue) {
      localStorage.setItem(`editor-code-${language}`, codeValue);
    }

    // Emit code change to other users
    socketRef.current?.emit(ACTIONS.CODE_CHANGE, { 
      value: codeValue, 
      roomId: params?.roomId 
    });
  };

  const handleFontSizeChange = (newSize: number) => {
    const size = Math.min(Math.max(newSize, 12), 24);
    setFontSize(size);
    localStorage.setItem("editor-font-size", size.toString());
  };

  // Socket connection setup
  useEffect(() => {
    if (!user?.id) return;

    const connectSocket = async () => {
      try {
        const socket = await initSocket();
        socketRef.current = socket;
        
        socket.on('connect_error', (err) => handleErrors(err));
        socket.on('connect_failed', (err) => handleErrors(err));

        function handleErrors(err: Error) {
          console.log('Socket connection error:', err);
          toast.error('Connection failed, try again later');
          router.push('/user');
        }

        socket.emit(ACTIONS.JOIN, {
          roomId: params?.roomId,
          userId: user.id,
        });
      } catch (error) {
        console.error('Failed to connect to socket:', error);
      }
    };

    connectSocket();
  }, [user?.id, params?.roomId]);

  // Socket event listeners setup
  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    // Handle user joined
    const handleUserJoined = ({ clients, userId, socketId }: JoinedEventData) => {
      if (userId !== user?.id) {
        toast.success(`${user?.fullName} joined the room`);
        console.log(`${user?.fullName} joined the room`);
      }
    };

    // Handle user disconnected
    const handleUserDisconnected = ({ socketId, userId }: DisconnectedEventData) => {
      toast.success(`${user?.fullName} left the room`);
      console.log(`${user?.fullName} left the room`);
      removeParticipant({ roomId: params?.roomId as string, userId });
    };

    // Handle code sync from other users
    const handleCodeSync = ({ code: receivedCode }: CodeSyncEventData) => {
      
      // Don't update if the code is the same as current editor content
      if (!editor || receivedCode === undefined || editor.getValue() === receivedCode) {
        return;
      }
      
      // Set flag to prevent infinite loop
      isReceivingCodeRef.current = true;
      
      // Save current cursor position
      const currentPosition = editor.getPosition();
      
      // Update editor content
      editor.setValue(receivedCode);
      
      // Restore cursor position if it's still valid
      if (currentPosition) {
        const model = editor.getModel();
        if (model) {
          const lineCount = model.getLineCount();
          const lastLineLength = model.getLineLength(lineCount);
          
          // Ensure position is within bounds
          const validPosition = {
            lineNumber: Math.min(currentPosition.lineNumber, lineCount),
            column: currentPosition.lineNumber <= lineCount 
              ? Math.min(currentPosition.column, model.getLineLength(currentPosition.lineNumber) + 1)
              : lastLineLength + 1
          };
          
          editor.setPosition(validPosition);
        }
      }
      
      // Update local state
      setCode(receivedCode);
      
      // Save to localStorage
      if (receivedCode) {
        localStorage.setItem(`editor-code-${language}`, receivedCode);
      }
      
      // Reset flag after a small delay
      setTimeout(() => {
        isReceivingCodeRef.current = false;
      }, 100);
    };

    // Set up listeners
    socket.on(ACTIONS.JOINED, handleUserJoined);
    socket.on(ACTIONS.DISCONNECTED, handleUserDisconnected);
    socket.on(ACTIONS.SYNC_CODE, handleCodeSync);

    // Cleanup
    return () => {
      socket.off(ACTIONS.JOINED, handleUserJoined);
      socket.off(ACTIONS.DISCONNECTED, handleUserDisconnected);
      socket.off(ACTIONS.SYNC_CODE, handleCodeSync);
      socket.disconnect();
    };
  }, [editor, language, user?.id, params?.roomId, removeParticipant]);

  if (!mounted) return null;

  return (
    <div className="relative">
      <div className="relative bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e1e2e] ring-1 ring-white/5">
              <Image src={"/" + language + ".png"} alt="Logo" width={24} height={24} />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white">Code Editor</h2>
              <p className="text-xs text-gray-500">Write and execute your code</p>
            </div>
          </div>
          <div className="flex items-center gap-3">

            {code && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-gray-300 bg-[#1e1e2e] cursor-pointer
            rounded-lg ring-1 ring-gray-800/50 hover:ring-gray-700/50 transition-all"
              >
                {isCopied ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            )}

            {/* Font Size Slider */}
            <div className="flex items-center gap-3 px-3 py-2 bg-[#1e1e2e] rounded-lg ring-1 ring-white/5">
              <TypeIcon className="size-4 text-gray-400" />
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                  className="w-20 h-1 bg-gray-600 rounded-lg cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-400 min-w-[2rem] text-center">
                  {fontSize}
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 bg-[#1e1e2e] hover:bg-[#2a2a3a] rounded-lg ring-1 ring-white/5 transition-colors cursor-pointer"
              aria-label="Reset to default code"
            >
              <RotateCcwIcon className="size-4 text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* Editor  */}
        <div className="relative group rounded-xl overflow-hidden ring-1 ring-white/[0.05]">
          {clerk.loaded && (
            <Editor
              height="600px"
              language={LANGUAGE_CONFIG[language].monacoLanguage}
              onChange={handleEditorChange}
              theme={theme}
              beforeMount={defineMonacoThemes}
              onMount={(editor) => setEditor(editor)}
              options={{
                minimap: { enabled: false },
                fontSize,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                renderWhitespace: "selection",
                fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                fontLigatures: true,
                cursorBlinking: "smooth",
                smoothScrolling: true,
                contextmenu: true,
                renderLineHighlight: "all",
                lineHeight: 1.6,
                letterSpacing: 0.5,
                roundedSelection: true,
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
              }}
            />
          )}

          {!clerk.loaded && <EditorPanelSkeleton />}
        </div>
      </div>
    </div>
  );
}
export default EditorPanel;