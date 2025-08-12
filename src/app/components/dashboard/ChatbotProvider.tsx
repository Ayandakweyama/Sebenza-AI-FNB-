'use client';

import React, { useState } from 'react';
import { Chatbot } from './Chatbot';
import { useDashboard } from './context/DashboardContext';

export const ChatbotProvider: React.FC = () => {
  const {
    chatbotOpen,
    setChatbotOpen,
    chatMessages,
    currentMessage,
    setCurrentMessage,
    isTyping,
    handleSendMessage
  } = useDashboard();

  return (
    <Chatbot 
      isOpen={chatbotOpen}
      onClose={() => setChatbotOpen(false)}
      messages={chatMessages}
      currentMessage={currentMessage}
      onMessageChange={setCurrentMessage}
      onSendMessage={handleSendMessage}
      isTyping={isTyping}
    />
  );
};
