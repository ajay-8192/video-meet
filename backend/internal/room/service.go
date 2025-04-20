package room

import (
	"errors"
	"time"
	"video-chat/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RoomService struct {
	db *gorm.DB
}

func NewRoomService(db *gorm.DB) *RoomService {
	return &RoomService{db: db}
}

func (r *RoomService) CreateRoom(req CreateRoomRequest, userId string) (*models.Room, error) {
	room := &models.Room{
		ID:           uuid.New().String(),
		Name:         req.Name,
		Description:  req.Description,
		IsPrivate:    req.IsPrivate,
		MaxUsers:     req.MaxUsers,
		CreatedBy:    userId,
		CreatedAt:    time.Now(),
		MembersCount: 1,
	}

	if req.Password != "" {
		room.RequirePassword = true
		room.Password = req.Password
	}

	if err := r.db.Create(room).Error; err != nil {
		return nil, err
	}

	member := &models.RoomMember{
		ID:        uuid.New().String(),
		RoomID:    room.ID,
		UserID:    userId,
		Role:      "admin",
		JoinedAt:  time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := r.db.Create(member).Error; err != nil {
		return nil, err
	}

	if req.IsPrivate && len(req.InviteUsers) > 0 {
		invitedMembers := make([]models.InvitedMember, len(req.InviteUsers))
		for i, email := range req.InviteUsers {
			invitedMembers[i] = models.InvitedMember{
				ID:        uuid.New().String(),
				RoomID:    room.ID,
				Email:     email,
				Status:    "pending",
				InvitedBy: userId,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
		}

		if err := r.db.CreateInBatches(invitedMembers, len(invitedMembers)).Error; err != nil {
			return nil, err
		}
	}

	return room, nil
}

func (r *RoomService) GetRoomById(roomId string) (*models.Room, error) {
	var room *models.Room

	if err := r.db.First(&room, "id = ?", roomId).Error; err != nil {
		return nil, err
	}

	return room, nil
}

func (r *RoomService) ListRooms(userId string) ([]models.Room, error) {
	var rooms []models.Room

	if err := r.db.
		Joins("JOIN room_members ON rooms.id = room_members.room_id").
		Where("room_members.user_id = ? OR rooms.created_by = ?", userId, userId).
		Select("DISTINCT rooms.*").
		Find(&rooms).Error; err != nil {
		return nil, err
	}

	return rooms, nil
}

func (r *RoomService) InvitedRooms(email string) ([]models.Room, error) {
	var rooms []models.Room

	if err := r.db.
		Joins("JOIN invited_members ON rooms.id = invited_members.room_id").
		Joins("JOIN users ON invited_members.invited_by = users.id").
		Where("invited_members.email = ? AND invited_members.status = ?", email, "pending").
		Select("rooms.*, users.email as invited_by_email, users.first_name as invited_by_name").
		Find(&rooms).Error; err != nil {
		return nil, err
	}

	return rooms, nil
}

func (r *RoomService) PendingRequestRooms(userId string) ([]models.Room, error) {
	var rooms []models.Room

	if err := r.db.
		Joins("JOIN join_requests ON rooms.id = join_requests.room_id").
		Where("join_requests.user_id = ? AND join_requests.status = ?", userId, "pending").
		Select("rooms.*").
		Find(&rooms).Error; err != nil {
		return nil, err
	}

	return rooms, nil
}

func (r *RoomService) PublicRooms(offset, limit int, userId string) ([]models.Room, error) {
	var rooms []models.Room

	if err := r.db.
		Where("is_private = ?", false).
		Where("id NOT IN (SELECT room_id FROM room_members WHERE user_id = ?)", userId).         // Exclude rooms where user is a member
		Order("created_at DESC").                                                                // Sort by most recently created first
		Order("(SELECT COUNT(*) FROM room_members WHERE room_members.room_id = rooms.id) DESC"). // Then by number of members
		Order("max_users ASC").                                                                  // Finally by max users (lower first)
		Offset(offset).
		Limit(limit).
		Find(&rooms).Error; err != nil {
		return nil, err
	}

	return rooms, nil
}

func (r *RoomService) JoinRoom(roomId, userId string) error {
	member := models.RoomMember{
		ID:       uuid.NewString(),
		RoomID:   roomId,
		UserID:   userId,
		Role:     "member",
		JoinedAt: time.Now(),
	}

	if err := r.db.Model(&models.Room{}).Where("id = ?", roomId).Update("members_count", gorm.Expr("members_count + ?", 1)).Error; err != nil {
		return err
	}

	if err := r.db.Create(&member).Error; err != nil {
		return err
	}
	return nil
}

func (r *RoomService) RequestJoin(roomId, userId, message string) error {
	request := models.JoinRequest{
		ID:        uuid.New().String(),
		RoomID:    roomId,
		UserID:    userId,
		Status:    "pending",
		Message:   message,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := r.db.Create(&request).Error; err != nil {
		return err
	}

	return nil
}

func (r *RoomService) LeaveRoom(roomId, userId string) error {
	// First check if user is a member of the room
	var member models.RoomMember
	if err := r.db.Where("room_id = ? AND user_id = ?", roomId, userId).First(&member).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user is not a member of this room")
		}
		return err
	}

	// Begin transaction
	tx := r.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// Delete the member
	if err := tx.Delete(&member).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Update room member count
	if err := tx.Model(&models.Room{}).Where("id = ?", roomId).Update("members_count", gorm.Expr("members_count - ?", 1)).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return err
	}

	return nil
}
