package room

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"video-chat/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type RoomHander struct {
	server      *RoomService
	redisClient *redis.Client
	ctx         context.Context
}

func NewRoomHandler(server *RoomService, redisClient *redis.Client) *RoomHander {
	return &RoomHander{server: server, redisClient: redisClient, ctx: context.Background()}
}

// ROOM HANDLERS
// Create room
type CreateRoomRequest struct {
	Name        string   `json:"name" binding:"required"`
	Description string   `json:"description"`
	IsPrivate   bool     `json:"isPrivate"`
	MaxUsers    int      `json:"maxUsers" binding:"max=25"`
	Password    string   `json:"password"`
	InviteUsers []string `json:"inviteUsers"`
}

func (r *RoomHander) CreateRoom(ctx *gin.Context) {
	var req CreateRoomRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.IsPrivate && len(req.InviteUsers) <= 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invite atleast 1 user to create private room"})
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

	var user models.User
	if err := r.server.db.Where("id = ?", userId).First(&user).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user details"})
		return
	}

	// Get pagination parameters
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Get different types of rooms concurrently
	type roomResult struct {
		Rooms          []models.Room
		InvitedRooms   []InvitedInfo
		Err            error
	}

	// Create channels for each room type
	joinedChan := make(chan roomResult)
	invitedChan := make(chan roomResult)
	requestChan := make(chan roomResult)
	publicChan := make(chan roomResult)

	// Launch goroutines for each room type
	go func() {
		rooms, err := r.server.ListRooms(userId)
		joinedChan <- roomResult{Rooms: rooms, Err: err}
	}()

	go func() {
		invitedRooms, err := r.server.InvitedRooms(user.Email)
		invitedChan <- roomResult{Rooms: nil, InvitedRooms: invitedRooms, Err: err}
	}()

	go func() {
		rooms, err := r.server.PendingRequestRooms(userId)
		requestChan <- roomResult{Rooms: rooms, Err: err}
	}()

	go func() {
		rooms, err := r.server.PublicRooms(offset, limit, userId)
		publicChan <- roomResult{Rooms: rooms, Err: err}
	}()

	// Collect results
	joinedResult := <-joinedChan
	invitedResult := <-invitedChan
	requestResult := <-requestChan
	publicResult := <-publicChan

	// Handle errors and set default empty slices
	joinedRooms := []models.Room{}
	if joinedResult.Err != nil {
		if !errors.Is(joinedResult.Err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch joined rooms"})
			return
		}
	} else {
		joinedRooms = joinedResult.Rooms
	}

	invitedRooms := []InvitedInfo{}
	if invitedResult.Err != nil {
		if !errors.Is(invitedResult.Err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invited rooms"})
			return
		}
	} else {
		invitedRooms = invitedResult.InvitedRooms
	}

	requestRooms := []models.Room{}
	if requestResult.Err != nil {
		if !errors.Is(requestResult.Err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch request rooms"})
			return
		}
	} else {
		requestRooms = requestResult.Rooms
	}

	publicRooms := []models.Room{}
	if publicResult.Err != nil {
		if !errors.Is(publicResult.Err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch public rooms"})
			return
		}
	} else {
		publicRooms = publicResult.Rooms
	}

	// rooms := map[string][]interface{
	// 	"joined":  joinedRooms,
	// 	"invited": invitedRooms,
	// 	"pending": requestRooms,
	// 	"public":  publicRooms,
	// }

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Fetch rooms successfully",
		"rooms":   gin.H{
			"joined":  joinedRooms,
			"invited": invitedRooms,
			"pending": requestRooms,
			"public":  publicRooms,
		},
	})
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

func (r *RoomHander) UpdateRoom(ctx *gin.Context) {
	
}

func (r *RoomHander) DeleteRoom(ctx *gin.Context) {

}

type RequestJoinRequest struct {
	Message string `json:"message" binding:"max=50"`
}

// Join request
func (r *RoomHander) RequestJoin(ctx *gin.Context) {
	roomId := ctx.Param("id")
	userId := ctx.GetString("userId")

	_, err := r.server.GetRoomById(roomId)

	if err == nil {

		var req RequestJoinRequest

		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := r.server.RequestJoin(roomId, userId, req.Message); err != nil {
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

// Cancel Request
func (r *RoomHander) CancelRequest(ctx *gin.Context) {
	roomId := ctx.Param("id")
	userId := ctx.GetString("userId")

	_, err := r.server.GetRoomById(roomId)

	if err == nil {

		if err := r.server.CancelRequest(roomId, userId); err != nil {
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

// Join Room Request
func (r *RoomHander) JoinRoomRequest(ctx *gin.Context) {

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
	roomId := ctx.Param("id")
	userId := ctx.GetString("userId")

	_, err := r.server.GetRoomById(roomId)

	if err == nil {
		if err := r.server.LeaveRoom(roomId, userId); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "Left room successfully"})
		return
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	// Handle any other errors
	ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
}

// Invite to room
func (r *RoomHander) InviteRoom(ctx *gin.Context) {

}

func (r *RoomHander) CancelInvite(ctx *gin.Context) {

}

// ROOM SETTINGS HANDLERS
//
