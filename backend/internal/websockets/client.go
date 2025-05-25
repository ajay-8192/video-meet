package websockets

import (
    "encoding/json"
    "log"
    "net/http"
    "time"

    "github.com/gorilla/websocket"
)

const (
    writeWait      = 10 * time.Second
    pongWait       = 60 * time.Second
    pingPeriod     = (pongWait * 9) / 10
    maxMessageSize = 512
)

var (
    newline = []byte{'\n'}
    space   = []byte{' '}
)

// Upgrader is the websocket upgrader
var Upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true // Implement proper origin checking in production
    },
}

// Client represents a connected WebSocket client
type Client struct {
    Hub      *Hub
    conn     *websocket.Conn
    send     chan []byte
    roomID   string
    userID   string
    userName string
}

// NewClient creates a new WebSocket client
func NewClient(hub *Hub, conn *websocket.Conn, roomID, userID, userName string) *Client {
    return &Client{
        Hub:      hub,
        conn:     conn,
        send:     make(chan []byte, 256),
        roomID:   roomID,
        userID:   userID,
        userName: userName,
    }
}

// ReadPump pumps messages from the WebSocket connection to the hub
func (c *Client) ReadPump() {
    defer func() {
        c.Hub.unregister <- c
        c.conn.Close()
    }()

    c.conn.SetReadLimit(maxMessageSize)
    c.conn.SetReadDeadline(time.Now().Add(pongWait))
    c.conn.SetPongHandler(func(string) error {
        c.conn.SetReadDeadline(time.Now().Add(pongWait))
        return nil
    })

    // Send user joined message
    joinMsg := Message{
        Type:      TypeUserJoined,
        RoomID:    c.roomID,
        UserID:    c.userID,
        Timestamp: time.Now(),
        Metadata: Metadata{
            UserName: c.userName,
        },
    }
    jsonMsg, _ := json.Marshal(joinMsg)
    c.Hub.broadcast <- jsonMsg

    for {
        _, message, err := c.conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                log.Printf("error: %v", err)
            }
            break
        }

        // Handle the message
        c.Hub.handleMessage(message, c)
    }
}

// WritePump pumps messages from the hub to the WebSocket connection
func (c *Client) WritePump() {
    ticker := time.NewTicker(pingPeriod)
    defer func() {
        ticker.Stop()
        c.conn.Close()
    }()

    for {
        select {
        case message, ok := <-c.send:
            c.conn.SetWriteDeadline(time.Now().Add(writeWait))
            if !ok {
                c.conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }

            w, err := c.conn.NextWriter(websocket.TextMessage)
            if err != nil {
                return
            }
            w.Write(message)

            n := len(c.send)
            for i := 0; i < n; i++ {
                w.Write(newline)
                w.Write(<-c.send)
            }

            if err := w.Close(); err != nil {
                return
            }
        case <-ticker.C:
            c.conn.SetWriteDeadline(time.Now().Add(writeWait))
            if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return
            }
        }
    }
}