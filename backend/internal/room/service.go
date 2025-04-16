package room

import (
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
		ID: uuid.New().String(),
		Name: req.Name,
		Description: req.Description,
		IsPrivate: req.IsPrivate,
		MaxUsers: req.MaxUsers,
	}

	if err := r.db.Create(room).Error; err != nil {
		return nil, err
	}

	member := &models.RoomMember{
		ID: uuid.New().String(),
		RoomID: room.ID,
		UserID: userId,
		Role: "admin",
		JoinedAt: time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := r.db.Create(member).Error; err != nil {
		return nil, err
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
		Where("is_private = ? OR created_by = ?", false, userId).
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

	if err := r.db.Create(&member).Error; err != nil {
		return err
	}
	return nil
}

func (r *RoomService) LeaveRoom() {

}
