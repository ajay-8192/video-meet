package websockets

import "time"

// MessageType represents different types of WebSocket messages
type MessageType string

const (
    TypeMessage     MessageType = "message"
    TypeTyping      MessageType = "typing"
    TypeReadReceipt MessageType = "read_receipt"
    TypeUserJoined  MessageType = "user_joined"
    TypeUserLeft    MessageType = "user_left"
    TypeError       MessageType = "error"
)

// Message represents the structure of all WebSocket messages
type Message struct {
    Type      MessageType `json:"type"`
    RoomID    string     `json:"roomId"`
    UserID    string     `json:"userId"`
    Content   string     `json:"content"`
    Timestamp time.Time  `json:"timestamp"`
    Metadata  Metadata   `json:"metadata,omitempty"`
}

// Metadata contains additional message information
type Metadata struct {
    IsTyping    bool     `json:"isTyping,omitempty"`
    ReadBy      []string `json:"readBy,omitempty"`
    MessageID   string   `json:"messageId,omitempty"`
    UserName    string   `json:"userName,omitempty"`
    UserAvatar  string   `json:"userAvatar,omitempty"`
}