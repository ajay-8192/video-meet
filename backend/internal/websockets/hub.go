package websockets

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

// Hub maintains the set of active clients and broadcasts messages to them
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Inbound messages from the clients
	broadcast chan []byte

	// Register requests from the clients
	Register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Room-specific clients
	rooms map[string]map[*Client]bool

	// Mutex for rooms map
	roomsMutex sync.RWMutex

	// User sessions
	userSessions      map[string]*Client
	userSessionsMutex sync.RWMutex
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		broadcast:    make(chan []byte),
		Register:     make(chan *Client),
		unregister:   make(chan *Client),
		clients:      make(map[*Client]bool),
		rooms:        make(map[string]map[*Client]bool),
		userSessions: make(map[string]*Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.clients[client] = true
			h.roomsMutex.Lock()
			if _, ok := h.rooms[client.roomID]; !ok {
				h.rooms[client.roomID] = make(map[*Client]bool)
			}
			h.rooms[client.roomID][client] = true
			h.roomsMutex.Unlock()

			// Add to user sessions
			h.userSessionsMutex.Lock()
			h.userSessions[client.userID] = client
			h.userSessionsMutex.Unlock()

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)

				h.roomsMutex.Lock()
				if room, ok := h.rooms[client.roomID]; ok {
					delete(room, client)
					if len(room) == 0 {
						delete(h.rooms, client.roomID)
					}
				}
				h.roomsMutex.Unlock()

				// Remove from user sessions
				h.userSessionsMutex.Lock()
				delete(h.userSessions, client.userID)
				h.userSessionsMutex.Unlock()

				// Send user left message
				leaveMsg := Message{
					Type:      TypeUserLeft,
					RoomID:    client.roomID,
					UserID:    client.userID,
					Timestamp: time.Now(),
					Metadata: Metadata{
						UserName: client.userName,
					},
				}
				jsonMsg, _ := json.Marshal(leaveMsg)
				h.broadcastToRoom(client.roomID, jsonMsg)
			}

		case message := <-h.broadcast:
			h.roomsMutex.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.roomsMutex.RUnlock()
		}
	}
}

func (h *Hub) broadcastToRoom(roomID string, message []byte) {
	h.roomsMutex.RLock()
	if room, ok := h.rooms[roomID]; ok {
		for client := range room {
			select {
			case client.send <- message:
			default:
				close(client.send)
				delete(room, client)
			}
		}
	}
	h.roomsMutex.RUnlock()
}

func (h *Hub) handleMessage(message []byte, sender *Client) {
	var msg Message
	if err := json.Unmarshal(message, &msg); err != nil {
		log.Printf("error unmarshaling message: %v", err)
		return
	}

	// Set message metadata
	msg.Timestamp = time.Now()
	msg.UserID = sender.userID

	// Handle different message types
	switch msg.Type {
	case TypeMessage:
		h.roomsMutex.RLock()
		if room, ok := h.rooms[msg.RoomID]; ok {
			for client := range room {
				// Skip sending to the sender
				if client != sender {
					select {
					case client.send <- message:
					default:
						close(client.send)
						delete(room, client)
					}
				}
			}
		}
		h.roomsMutex.RUnlock()

	case TypeTyping:
		h.broadcastToRoom(msg.RoomID, message)

	case TypeReadReceipt:
		h.broadcastToRoom(msg.RoomID, message)

	case TypeUserJoined:
		h.broadcastToRoom(msg.RoomID, message)

	case TypeUserLeft:
		h.broadcastToRoom(msg.RoomID, message)
	}
}
