import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://chat-app-h20n.onrender.com/");

function App() {
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [room, setRoom] = useState("")
  const typingTimeoutRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const chatContainerRef = useRef(null);


  useEffect(() => {
  const handleReceiveMessage = (data) => {
    setChat((prev) => [...prev, data]);
  };

  

  socket.on("receiveMessage", handleReceiveMessage);
  

  return () => {
    socket.off("receiveMessage", handleReceiveMessage);
    
  };
}, []);

  const joinChat = () => {
    if (username.trim() && room.trim()) 
       {
    setIsJoined(true);
    socket.emit("join", { username, room });  
  }
  };
  
 

const handleTyping = (e) => {
  setMessage(e.target.value);

  clearTimeout(typingTimeoutRef.current);

   socket.emit("typing", { room, username })
   clearTimeout(typingIntervalRef.current);

  typingTimeoutRef.current = setTimeout(() => {
    socket.emit("typing", { room, username: "" });
  }, 2000);
};

  useEffect(() => {
  const handleUserTyping = (user) => {
    if (user && user !== username) {
      // Add user if not already typing
      setTypingUsers((prev) => {
        if (!prev.includes(user)) {
          return [...prev, user];
        }
        return prev;
      });

      clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== user));
      }, 1500);
    } else {
      // If empty string, remove that user
      setTypingUsers((prev) => prev.filter((u) => u !== user));
    }
  };

  socket.on("userTyping", handleUserTyping);

  return () => {
    socket.off("userTyping", handleUserTyping);
  };
}, [username]);

 useEffect(() => {
  if (chatContainerRef.current) {
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }
}, [chat]);




  const sendMessage = () => {
    if (message.trim()) {
      setChat((prev) => [...prev, { user: username, text: message }]);
      socket.emit("sendMessage", { user: username, room, text: message });
      setMessage("");
       
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      {!isJoined ? (
        <div className="p-8 bg-gray-800 rounded-lg shadow-lg w-96 text-center">
          <h2 className="text-2xl font-bold mb-6 text-pink-500">Join Chat Room</h2>
          <input
            type="text"
            placeholder="Enter your name"
            className="w-full mb-4 p-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter room code"
            className="w-full mb-6 p-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button
            onClick={joinChat}
            className="w-full bg-pink-600 hover:bg-pink-700 p-3 rounded-lg font-semibold transition"
          >
            Join Chat
          </button>
        </div>
      ) : (
        <div className="p-6 bg-gray-900 rounded-lg shadow-lg w-[600px] flex flex-col">
          <h2 className="text-xl font-bold text-pink-500 mb-4 text-center">Group Chat</h2>
          <div ref={chatContainerRef} className="h-80 scrollable overflow-y-scroll bg-gray-800 p-4 rounded space-y-2">
            {chat.map((msg, i) => (
              <div key={i} className={`w-full flex ${
        msg.user === username ? "justify-end" : msg.user === "System" ? "justify-center" : "justify-start"
      }`}>
                {msg.user === "System" ? (
        <div className="flex justify-center">
        <div className="text-white italic text-sm bg-gray-700 px-3 py-1 break-words rounded-lg">{msg.text}</div>
        </div>
      ) : msg.user === username ? (
          <div className="flex justify-end">
            <div className="bg-pink-600 text-white px-4 py-2 rounded-xl max-w-xs break-words text-sm">
              {msg.text}
            </div>
          </div>
        ) : (
        <div className="flex justify-start">
        <div className="bg-gray-700 text-white px-4 py-2 rounded-xl max-w-xs break-words text-sm">
          <p className="text-xs font-semibold text-blue-400 mb-1">{msg.user}</p>
          {msg.text}
        </div>
        </div>
      )}
              </div>
              ))}
              {typingUsers.length > 0 && (
  <p className="text-sm text-gray-300 italic">
    {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...
  </p>
)}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 p-2 rounded-lg bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={message}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-semibold"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
