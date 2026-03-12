import React from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';

function App() {
    return (
        <div className="flex w-screen h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <ChatInterface />
        </div>
    );
}

export default App;
