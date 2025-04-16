package auth

import (
	"video-chat/internal/models"

	"gorm.io/gorm"
)

type AuthServer struct {
	db *gorm.DB
}

func NewAuthServer(db *gorm.DB) *AuthServer {
	return &AuthServer{db: db}
}

func (s *AuthServer) GetUser(email, username string) (*models.User, error) {
	var user models.User
	if err := s.db.Where("email = ? or username = ?", email, username).First(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *AuthServer) GetUserByID(userId string) (*models.User, error) {
	var user models.User
	if err := s.db.Where("id = ?", userId).First(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *AuthServer) GetDraftUser(email, username string) (*models.DraftUser, error) {
	var draftUser models.DraftUser
	if err := s.db.Where("email = ? or username = ?", email, username).First(&draftUser).Error; err != nil {
		return nil, err
	}

	return &draftUser, nil
}

func (s *AuthServer) CreateDraftUser(firstname, lastname, email, username, verifyId string) (*models.DraftUser, error) {
	draftUser := models.DraftUser{
		FirstName: firstname,
		LastName: lastname,
		Email: email,
		Username: username,
		VerifyID: verifyId,
	}

	if err := s.db.Create(&draftUser).Error; err != nil {
		return nil, err
	}

	return &draftUser, nil
}

func (s *AuthServer) CreateUser(draftUser *models.DraftUser, id string) (*models.User, error) {
	user := models.User{
		FirstName: draftUser.FirstName,
		LastName: draftUser.LastName,
		Email: draftUser.Email,
		Username: draftUser.Username,
		ID: id,
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, err
	}


	return &user, nil
}

func (s *AuthServer) RemoveDraftUser(draftUser *models.DraftUser) error {
	return s.db.Where("email = ?", draftUser.Email).Delete(&models.DraftUser{}).Error
}

func (s *AuthServer) DeleteUser(user *models.User) error {
	return s.db.Delete(&user).Error
}
