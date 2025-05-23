package room

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"
	"video-chat/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

type CreateRoomRequest struct {
	Name                string   `json:"name" binding:"required"`
	Description         string   `json:"description"`
	MaxParticipants     int      `json:"maxUsers" binding:"required"`
	IsPrivate           bool     `json:"isPrivate"`
	IsPasswordProtected bool     `json:"passwordProtected"`
	Password            string   `json:"password"`
	InvitedUsers        []string `json:"inviteUsers"`
}

func (r *RoomHander) CreateRoom(ctx *gin.Context) {
	var req CreateRoomRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.IsPrivate && len(req.InvitedUsers) < 1 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Atleast 1 user need to be invited"})
		return
	}

	userId := ctx.GetString("userId")

	// Create room and also add invited users in case of private
	room, err := r.server.CreateRoom(req, userId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "error"})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Room created successfully",
		"room":    room,
	})
}

func (r *RoomHander) DeleteRoom(ctx *gin.Context) {
	roomId := ctx.Param("roomId")

	if err := r.server.DeleteRoom(roomId); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "error"})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Room deleted successfully",
	})
}

type roomResult struct {
	Rooms          []models.Room
	InvitedRooms   []invitedInfo
	Err            error
}

func (r *RoomHander) GetRoomsList(ctx *gin.Context) {
	roomType := ctx.DefaultQuery("roomType", "all")
	userId := ctx.GetString("userId")

	var user models.User
	if err := r.server.db.Where("id = ?", userId).First(&user).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user details"})
		return
	}

	switch roomType {
	case "joined":
		rooms, err := r.server.GetJoinedRooms(userId)

		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"message": "Fetch joined rooms successfully",
			"rooms": gin.H{
				"joined": rooms,
			},
		})
	case "invited":
		rooms, err := r.server.GetInvitedRooms(user.Email)

		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"message": "Fetch joined rooms successfully",
			"rooms": gin.H{
				"invited": rooms,
			},
		})
	case "requestPending":
		rooms, err := r.server.GetJoinRequestRooms(userId)
		
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"message": "Fetch joined rooms successfully",
			"rooms": gin.H{
				"pending": rooms,
			},
		})
	case "public":
		page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit

		rooms, err := r.server.GetPublicRooms(userId, limit, offset)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"message": "Fetch joined rooms successfully",
			"rooms": gin.H{
				"public": rooms,
			},
		})
	default:

		page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit

		joinedChan := make(chan roomResult)
		invitedChan := make(chan roomResult)
		requestChan := make(chan roomResult)
		publicChan := make(chan roomResult)

		go func () {
			rooms, err := r.server.GetJoinedRooms(userId)
			joinedChan <- roomResult{Rooms: rooms, Err: err}
		}()

		go func() {
			invitedRooms, err := r.server.GetInvitedRooms(user.Email)
			invitedChan <- roomResult{InvitedRooms: invitedRooms, Err: err}
		}()

		go func() {
			rooms, err := r.server.GetJoinRequestRooms(userId)
			requestChan <- roomResult{Rooms: rooms, Err: err}
		}()

		go func() {
			rooms, err := r.server.GetPublicRooms(userId, limit, offset)
			publicChan <- roomResult{Rooms: rooms, Err: err}
		}()

		joinedResult := <-joinedChan
		invitedResult := <-invitedChan
		requestResult := <-requestChan
		publicResult := <-publicChan

		joinedRooms := []models.Room{}
		if joinedResult.Err != nil {
			if !errors.Is(joinedResult.Err, gorm.ErrRecordNotFound) {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch joined rooms"})
				return
			}
		} else {
			joinedRooms = joinedResult.Rooms
		}

		invitedRooms := []invitedInfo{}
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
}

func (r *RoomHander) AcceptRoomInvite(ctx *gin.Context) {
	roomId := ctx.Param("roomId")
	userId := ctx.GetString("userId")

	var user models.User
	if err := r.server.db.Where("id = ?", userId).First(&user).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user details"})
		return
	}

	invitee, err := r.server.GetRoomInvite("", user.Email, roomId)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid invite"})
		return
	}

	if err == nil {
		if err := r.server.AcceptRoomInvite(userId, roomId, invitee); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if err := r.server.updateRoomMemberCount(roomId); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "Added to Room"})
		return
	} else {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}

func (r *RoomHander) DeclineInvitaion(ctx *gin.Context) {
	roomId := ctx.Param("roomId")
	userId := ctx.GetString("userId")

	invitee, err := r.server.GetRoomInvite(userId, "", roomId)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		ctx.JSON(http.StatusOK, gin.H{"error": "Not invitations from this room"})
		return
	}

	if err == nil {
		if err := r.server.DeclineInvitaion(invitee); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "Added to Room"})
		return
	} else {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}

type addJoinRequest struct {
	Message string `json:"message"`
} 

func (r *RoomHander) RequestToJoin(ctx *gin.Context) {
	roomId := ctx.Param("roomId")
	userId := ctx.GetString("userId")

	var req addJoinRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		fmt.Printf("Invalid request to join request: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	joineeRequest, err := r.server.GetJoinRequest(userId, roomId)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		newJoinRequest, err := r.server.AddJoinRequest(userId, roomId, req.Message)
		if err != nil {
			fmt.Printf("Failed to create request to join: %v\n", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusCreated, gin.H{
			"message": "Successfully sent request to join to room",
			"joineeRequest": newJoinRequest,
		})
		return
	}

	if err == nil {
		ctx.JSON(http.StatusOK, gin.H{
			"message": "Join request already exist",
			"joineeRequest": joineeRequest,
		})
		return
	} else {
		fmt.Printf("Internal server error: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}

func (r *RoomHander) LeaveRoom(ctx *gin.Context) {
	roomId := ctx.Param("roomId")
	userId := ctx.GetString("userId")

	roomMember, err := r.server.GetRoomMember(userId, roomId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := r.server.DeleteRoomMember(roomMember); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Left room successfully"})
}

func (r *RoomHander) GetJoinRequest(ctx *gin.Context) {
	roomId := ctx.Param("roomId")
	userId := ctx.GetString("userId")

	joineeRequest, err := r.server.GetJoinRequest(userId, roomId)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		ctx.JSON(http.StatusOK, gin.H{"error": "No Request found for this room"})
		return
	}

	if err == nil {
		ctx.JSON(http.StatusOK, gin.H{
			"message": "Fetched Join Request successfully",
			"joinRequest": joineeRequest,
		})
		return
	} else {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}

func (r *RoomHander) CancelJoinReqest(ctx *gin.Context) {
	roomId := ctx.Param("roomId")
	userId := ctx.GetString("userId")

	joineeRequest, err := r.server.GetJoinRequest(userId, roomId)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		ctx.JSON(http.StatusOK, gin.H{"error": "No Request found for this room"})
		return
	}

	if err == nil {
		if err := r.server.CancelJoinReqest(joineeRequest); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "Cancelled request to join Room"})
		return
	} else {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}

type cancelInviteRequest struct {
	Email string `json:"email" binding:"required"`
}

func (r *RoomHander) CancelInvite(ctx *gin.Context) {
	roomId := ctx.Param("roomId")

	var req cancelInviteRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "user email is mandatory"})
		return
	}

	invitedMember, err := r.server.GetRoomInvite("", req.Email, roomId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Not Invited members with this email"})
		return
	}

	if err := r.server.CancelInvite(invitedMember); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Invite cancelled successfully"})
}

type roomMessageRequest struct {
	Content string `json:"content" binding:"required"`
}

func (r *RoomHander) SendMessage(ctx *gin.Context) {
	userId := ctx.GetString("userId")
	roomId := ctx.Param("roomId")

	var req roomMessageRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Content) > 2500 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Message too long"})
		return
	}

	room, err := r.server.getRoomDetails(roomId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	roomMember, err := r.server.GetRoomMember(userId, roomId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	message := &models.Message{
		ID: uuid.NewString(),
		RoomID: room.ID,
		UserID: roomMember.UserID,
		Content: req.Content,
		CreatedAt: time.Now(),
	}

	if err := r.server.addMessage(message); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to send message"})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Message sent",
		"content": message,
	})
}

func (r *RoomHander) FetchMessageByRoomId(ctx *gin.Context) {
	fmt.Printf("Fetching messages for room %s\n", ctx.Param("roomId"))
	
	roomId := ctx.Param("roomId")
	userId := ctx.GetString("userId")
	limit, err := strconv.Atoi(ctx.DefaultQuery("limit", "20"))
	if err != nil {
		fmt.Printf("Invalid limit parameter: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	fmt.Printf("Fetching %d messages\n", limit)

	room, err := r.server.getRoomDetails(roomId)
	if err != nil {
		fmt.Printf("Failed to get room details: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_, err = r.server.GetRoomMember(userId, roomId)
	if err != nil {
		fmt.Printf("Failed to get room member: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	beforeTime := time.Now()
	if beforeStr := ctx.Query("before"); beforeStr != "" {
		if t, err := time.Parse(time.RFC3339, beforeStr); err == nil {
			beforeTime = t
			fmt.Printf("Using custom before time: %v\n", beforeTime)
		}
	}

	messages, err := r.server.fetchMessages(room.ID, beforeTime, limit)
	if err != nil {
		fmt.Printf("Failed to fetch messages: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	fmt.Printf("Successfully fetched %d messages\n", len(messages))

	sorted := make([]models.Message, len(messages))
	for i := range messages {
		sorted[i] = messages[len(messages)-1-i]
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Fetched messages",
		"messageData": sorted,
	})
	fmt.Printf("Successfully returned messages to client\n")
}

func (r *RoomHander) EditMessage(ctx *gin.Context) {
	roomId := ctx.Param("roomId")
	messageId := ctx.Param("messageId")
	userId := ctx.GetString("userId")

	var req roomMessageRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Content) > 2500 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Message too long"})
		return
	}

	message, err := r.server.getMessageById(messageId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Message Not found"})
		return
	}

	if message.UserID != userId {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own messages"})
		return
	}

	if message.RoomID != roomId {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own messages"})
		return
	}

	if time.Since(message.CreatedAt) > time.Hour {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Edit window expired"})
		return
	}

	message.Content = req.Content
	message.UpdatedAt = time.Now()
	if err := r.server.editMessage(message); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update message"})
		return
	}

	ctx.JSON(http.StatusOK, message)
}

func (r *RoomHander) DeleteMessage(ctx *gin.Context) {
	roomId := ctx.Param("roomId")
	messageId := ctx.Param("messageId")
	userId := ctx.GetString("userId")

	message, err := r.server.getMessageById(messageId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Message Not found"})
		return
	}

	if message.UserID != userId {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own messages"})
		return
	}

	if message.RoomID != roomId {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own messages"})
		return
	}

	if time.Since(message.CreatedAt) > time.Hour {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "delete window expired"})
		return
	}

	if err := r.server.deleteMessage(message); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete message"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Message deleted"})
}
