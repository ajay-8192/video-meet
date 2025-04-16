package room

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RoomHander struct {
	server *RoomService
}

func NewRoomHandler(server *RoomService) *RoomHander {
	return &RoomHander{server: server}
}

// ROOM HANDLERS
// Create room
type CreateRoomRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	IsPrivate   bool   `json:"isPrivate"`
	MaxUsers    int    `json:"maxUsers" binding:"max=20"`
}

func (r *RoomHander) CreateRoom(ctx *gin.Context) {
	var req CreateRoomRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userId := ctx.GetString("userId")
	room, err := r.server.CreateRoom(req, userId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Created room successfully",
		"room":    room,
	})
}

// List rooms
func (r *RoomHander) ListRooms(ctx *gin.Context) {
	userId := ctx.GetString("userId")
	rooms, err := r.server.ListRooms(userId)

	if err == nil {
		ctx.JSON(http.StatusOK, gin.H{
			"message": "Fetch rooms successfully",
			"rooms":   rooms,
		})
		return
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		ctx.JSON(http.StatusOK, gin.H{
			"message": "No rooms found",
			"rooms":   []string{},
		})
		return
	}

	// Handle any other errors
	fmt.Printf("Error fetching rooms: %v\n", err)
	ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
}

// Get room
func (r *RoomHander) GetRoom(ctx *gin.Context) {
	roomId := ctx.Param("id")

	room, err := r.server.GetRoomById(roomId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Fetched room details",
		"room":    room,
	})
}

// Join room
func (r *RoomHander) JoinRoom(ctx *gin.Context) {
	roomId := ctx.Param("id")
	userId := ctx.GetString("userId")

	_, err := r.server.GetRoomById(roomId)

	if err == nil {
		if err := r.server.JoinRoom(roomId, userId); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "Joined room successfully"})
		return
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	// Handle any other errors
	ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
}

// Leave room
func (r *RoomHander) LeaveRoom(ctx *gin.Context) {

}

// Invite to room
func (r *RoomHander) InviteRoom(ctx *gin.Context) {

}

// ROOM SETTINGS HANDLERS
//
