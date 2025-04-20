package database

import (
	"fmt"
	"log"
	"video-chat/internal/config"
	"video-chat/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitMySQL(cfg *config.Config) *gorm.DB {

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		cfg.DB_HOST, cfg.DB_USER, cfg.DB_PASSWORD, cfg.DB_NAME, cfg.DB_PORT, cfg.DB_SSLMODE)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database", err)
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.DraftUser{},
		&models.Room{},
		&models.RoomMember{},
		&models.InvitedMember{},
		&models.JoinRequest{},
		&models.RoomStats{},
		&models.Message{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	return db
}
