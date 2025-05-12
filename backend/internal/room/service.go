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

func (s *RoomService) CreateRoom(req CreateRoomRequest, userId string) (*models.Room, error) {

	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	room := &models.Room{
		ID:              uuid.NewString(),
		Name:            req.Name,
		Description:     req.Description,
		CreatedBy:       userId,
		CreatedAt:       time.Now(),
		IsPrivate:       req.IsPrivate,
		MaxUsers:        req.MaxParticipants,
		RequirePassword: req.IsPasswordProtected,
		Password:        req.Password,
		MembersCount:    1,
	}

	if err := tx.Create(&room).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	roomMember := &models.RoomMember{
		ID:        uuid.NewString(),
		RoomID:    room.ID,
		UserID:    userId,
		Role:      "admin",
		JoinedAt:  time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := tx.Create(&roomMember).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return room, nil
}

func (s *RoomService) GetRoomMember(userId, roomId string) (*models.RoomMember, error) {
	var roomMember *models.RoomMember

	if err := s.db.Where("user_id = ? AND room_id = ?", userId, roomId).First(roomMember).Error; err != nil {
		return nil, err
	}

	return roomMember, nil
}

func (s *RoomService) DeleteRoomMember(roomMember *models.RoomMember) error {
	if err := s.db.Delete(roomMember).Error; err != nil {
		return err
	}

	return nil
}

func (s *RoomService) DeleteRoom(roomId string) error {
	tx := s.db.Begin()

	// Delete Room Members
	if err := tx.Where("room_id = ?", roomId).Delete(&models.RoomMember{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Delete invited members by roomId
	if err := tx.Where("room_id = ?", roomId).Delete(&models.InvitedMember{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Delete Join request by roomId
	if err := tx.Where("room_id = ?", roomId).Delete(&models.JoinRequest{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Delete Room Stats by roomId
	if err := tx.Where("room_id = ?", roomId).Delete(&models.RoomStats{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Delete Message by roomId
	if err := tx.Where("room_id = ?", roomId).Delete(&models.Message{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Delete Room by roomId
	if err := tx.Where("id = ?", roomId).Delete(&models.Room{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return err
	}

	return nil
}

type invitedInfo struct {
	models.Room
	InvitedByEmail string
	InvitedByName  string
}

func (s *RoomService) GetJoinedRooms(userId string) ([]models.Room, error) {
	var rooms []models.Room

	subQuery := s.db.Model(&models.RoomMember{}).
		Select("room_id").
		Where("user_id = ?", userId)

	if err := s.db.
		Model(&models.Room{}).
		Where("id IN (?) OR created_by = ?", subQuery, userId).
		Find(&rooms).Error; err != nil {
		return nil, err
	}

	return rooms, nil
}

func (s *RoomService) GetInvitedRooms(email string) ([]invitedInfo, error) {

	var results []invitedInfo

	var invites []models.InvitedMember
	if err := s.db.
		Where("email = ? AND status = ?", email, "pending").
		Find(&invites).Error; err != nil {
		return nil, err
	}

	if len(invites) == 0 {
		return []invitedInfo{}, nil
	}

	roomIDs := make([]string, 0, len(invites))
	inviterMap := make(map[string]string)

	for _, invite := range invites {
		roomIDs = append(roomIDs, invite.RoomID)
		inviterMap[invite.RoomID] = invite.InvitedBy
	}

	var rooms []models.Room
	if err := s.db.Where("id IN ?", roomIDs).Find(&rooms).Error; err != nil {
		return nil, err
	}

	inviterIDs := make([]string, 0, len(inviterMap))
	for _, inviterId := range inviterMap {
		inviterIDs = append(inviterIDs, inviterId)
	}

	var users []models.User
	if err := s.db.
		Where("id IN ?", inviterIDs).
		Find(&users).Error; err != nil {
		return nil, err
	}

	userMap := make(map[string]models.User)
	for _, u := range users {
		userMap[u.ID] = u
	}

	for _, room := range rooms {
		inviterID := inviterMap[room.ID]
		user := userMap[inviterID]

		results = append(results, invitedInfo{
			Room:           room,
			InvitedByEmail: user.Email,
			InvitedByName:  user.FirstName,
		})
	}

	return results, nil
}

func (s *RoomService) GetJoinRequestRooms(userId string) ([]models.Room, error) {
	subQuery := s.db.Model(&models.JoinRequest{}).
		Select("room_id").
		Where("user_id = ? AND status = ?", userId, "pending")

	var rooms []models.Room
	if err := s.db.Where("id IN (?)", subQuery).Find(&rooms).Error; err != nil {
		return nil, err
	}

	return rooms, nil
}

func (s *RoomService) GetPublicRooms(userId string, limit, offset int) ([]models.Room, error) {
	var rooms []models.Room

	if err := s.db.
		Model(&models.Room{}).
		Where(`
			is_private = FALSE AND 
			NOT EXISTS (SELECT 1 FROM room_members WHERE room_members.room_id = rooms.id AND user_id = ?) AND
			NOT EXISTS (SELECT 1 FROM join_requests WHERE join_requests.room_id = rooms.id AND user_id = ?) AND
			NOT EXISTS (
				SELECT 1 FROM invited_members 
				WHERE invited_members.room_id = rooms.id 
				AND email = (SELECT email FROM users WHERE id = ?)
			)
		`, userId, userId, userId).
		Order("created_at DESC").
		Order("(SELECT COUNT(*) FROM room_members WHERE room_members.room_id = rooms.id) DESC").
		Order("max_users ASC").
		Offset(offset).
		Limit(limit).
		Find(&rooms).Error; err != nil {
		return nil, err
	}
	return rooms, nil
}

func (s *RoomService) GetRoomInvite(userId, email, roomId string) (*models.InvitedMember, error) {
	var invite *models.InvitedMember
	if err := s.db.Where("(invited_by = ? OR email = ?) AND room_id = ?", userId, email, roomId).First(&invite).Error; err != nil {
		return nil, err
	}

	return invite, nil
}

func (s *RoomService) CancelInvite(invitedMember *models.InvitedMember) error {
	if err := s.db.Delete(invitedMember).Error; err != nil {
		return err
	}

	return nil
}

func (s *RoomService) AcceptRoomInvite(userId, roomId string, invitee *models.InvitedMember) error {
	roomMember := &models.RoomMember{
		ID:        uuid.NewString(),
		RoomID:    roomId,
		UserID:    userId,
		JoinedAt:  time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	tx := s.db.Begin()

	if err := tx.Create(roomMember).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Delete(invitee).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Model(&models.Room{}).Where("id = ?", roomId).Update("members_count", gorm.Expr("members_count + ?", 1)).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return err
	}

	return nil
}

func (s *RoomService) DeclineInvitaion(invitee *models.InvitedMember) error {
	if err := s.db.Delete(invitee).Error; err != nil {
		return err
	}

	return nil
}

func (s *RoomService) AddJoinRequest(userId, roomId, message string) (*models.JoinRequest, error) {
	joinRequest := &models.JoinRequest{
		ID:        uuid.NewString(),
		RoomID:    roomId,
		UserID:    userId,
		Status:    "pending",
		Message:   message,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(joinRequest).Error; err != nil {
		return nil, err
	}

	return joinRequest, nil
}

func (s *RoomService) GetJoinRequest(userId, roomId string) (*models.JoinRequest, error) {
	var joinRequest models.JoinRequest

	if err := s.db.Where("user_id = ? AND room_id = ?", userId, roomId).First(&joinRequest).Error; err != nil {
		return nil, err
	}

	return &joinRequest, nil
}

func (s *RoomService) CancelJoinReqest(joinRequest *models.JoinRequest) error {
	if err := s.db.Delete(joinRequest).Error; err != nil {
		return err
	}

	return nil
}

func (s *RoomService) getRoomDetails(roomId string) (*models.Room, error) {
	var room *models.Room

	if err := s.db.Where("id = ?", roomId).First(room).Error; err != nil {
		return nil, err
	}

	return room, nil
}

func (s *RoomService) updateRoomMemberCount(roomId string) error {
	if err := s.db.Where("id = ?", roomId).Update("members_count", gorm.Expr("members_count + ?", 1)).Error; err != nil {
		return err
	}

	return nil
}

func (s *RoomService) addMessage(message *models.Message) error {
	if err := s.db.Create(message).Error; err != nil {
		return err
	}

	return nil
}

func (s *RoomService) getMessageById(messageId string) (*models.Message, error) {
	var message *models.Message
	if err := s.db.Where("id = ?", messageId).First(message).Error; err != nil {
		return nil, err
	}

	return message, nil
}

func (s *RoomService) editMessage(message *models.Message) error {
	if err := s.db.Save(message).Error; err != nil {
		return err
	}

	return nil
}

func (s *RoomService) deleteMessage(message *models.Message) error {
	if err := s.db.Delete(message).Error; err != nil {
		return err
	}

	return nil
}

func (s *RoomService) fetchMessages(roomId string, beforeTime time.Time, limit int) ([]models.Message, error) {
	var messages []models.Message

	if err := s.db.Where("room_id = ? AND created_at = ?", roomId, beforeTime).Order("created_at desc").Limit(limit).Find(&messages).Error; err != nil {
		return nil, err
	}

	return messages, nil
}
