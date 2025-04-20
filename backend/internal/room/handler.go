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
		rooms []models.Room
		err   error
	}

	// Create channels for each room type
	joinedChan := make(chan roomResult)
	invitedChan := make(chan roomResult)
	requestChan := make(chan roomResult)
	publicChan := make(chan roomResult)

	// Launch goroutines for each room type
	go func() {
		rooms, err := r.server.ListRooms(userId)
		joinedChan <- roomResult{rooms, err}
	}()

	go func() {
		rooms, err := r.server.InvitedRooms(user.Email)
		invitedChan <- roomResult{rooms, err}
	}()

	go func() {
		rooms, err := r.server.PendingRequestRooms(userId)
		requestChan <- roomResult{rooms, err}
	}()

	go func() {
		rooms, err := r.server.PublicRooms(offset, limit, userId)
		publicChan <- roomResult{rooms, err}
	}()

	// Collect results
	joinedResult := <-joinedChan
	invitedResult := <-invitedChan
	requestResult := <-requestChan
	publicResult := <-publicChan

	// Handle errors and set default empty slices
	joinedRooms := []models.Room{}
	if joinedResult.err != nil {
		if !errors.Is(joinedResult.err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch joined rooms"})
			return
		}
	} else {
		joinedRooms = joinedResult.rooms
	}

	invitedRooms := []models.Room{}
	if invitedResult.err != nil {
		if !errors.Is(invitedResult.err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invited rooms"})
			return
		}
	} else {
		invitedRooms = invitedResult.rooms
	}

	requestRooms := []models.Room{}
	if requestResult.err != nil {
		if !errors.Is(requestResult.err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch request rooms"})
			return
		}
	} else {
		requestRooms = requestResult.rooms
	}

	publicRooms := []models.Room{}
	if publicResult.err != nil {
		if !errors.Is(publicResult.err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch public rooms"})
			return
		}
	} else {
		publicRooms = publicResult.rooms
	}

	rooms := map[string][]models.Room{
		"joined":  joinedRooms,
		"invited": invitedRooms,
		"pending": requestRooms,
		"public":  publicRooms,
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Fetch rooms successfully",
		"rooms":   rooms,
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

// ROOM SETTINGS HANDLERS
//
