package models

import "time"

type Room struct {
	ID          string `json:"id" gorm:"primaryKey,index"`
	Name        string `json:"name" gorm:"not null"`
	Description string `json:"description"`
	CreatedBy   string `json:"createdBy" gorm:"not null"`
	IsPrivate   bool   `json:"isPrivate" gorm:"default:true"`
	MaxUsers    int    `json:"maxUsers" gorm:"default:10"`

	AllowChat        bool   `json:"allow_chat" gorm:"default:true"`
	AllowScreenShare bool   `json:"allow_screen_share" gorm:"default:true"`
	MuteOnEntry      bool   `json:"mute_on_entry" gorm:"default:true"`
	RequirePassword  bool   `json:"require_password" gorm:"default:false"`
	Password         string `json:"-" gorm:"default:null"`
}

type RoomMember struct {
	ID        string    `json:"id" gorm:"primaryKey,index"`
	RoomID    string    `json:"roomId" gorm:"not null"`
	UserID    string    `json:"userId" gorm:"not null"`
	Role      string    `json:"role" gorm:"default:member"`
	JoinedAt  time.Time `json:"joinedAt"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type InvitedMember struct {
	ID        string    `json:"id" gorm:"primaryKey,index"`
	RoomID    string    `json:"roomId" gorm:"not null"`
	Email     string    `json:"email" gorm:"not null"`
	Status    string    `json:"status" gorm:"default:pending"` // pending, accepted, rejected
	InvitedBy string    `json:"invitedBy" gorm:"not null"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type JoinRequest struct {
	ID        string    `json:"id" gorm:"primaryKey,index"`
	RoomID    string    `json:"roomId" gorm:"not null"`
	UserID    string    `json:"userId" gorm:"not null"`
	Status    string    `json:"status" gorm:"default:pending"` // pending, approved, rejected
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type RoomStats struct {
	ID                string    `json:"id" gorm:"primaryKey,index"`
	RoomID            string    `json:"roomId" gorm:"not null"`
	TotalParticipants int       `json:"totalParticipants" gorm:"not null"`
	AverageDuration   int       `json:"averageDuration" gorm:"not null"` // In seconds
	TotalMeetings     int       `json:"totalMeetings" gorm:"not null"`
	BandwidthUsage    int64     `json:"bandwidthUsage" gorm:"not null"` // In bytes
	UpdatedAt         time.Time `json:"updatedAt"`
}

type Message struct {
	ID        string    `json:"id" gorm:"primaryKey,index"`
	RoomID    string    `json:"roomId" gorm:"not null"`
	UserID    string    `json:"userId" gorm:"not null"`
	Content   string    `json:"content" gorm:"not null"`
	CreatedAt time.Time `json:"createdAt"`
}
