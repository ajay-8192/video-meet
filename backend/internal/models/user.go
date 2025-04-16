package models

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	ID        string `json:"id" gorm:"primaryKey;unique;index"`
	FirstName string `json:"firstname" gorm:"not null;index:idx_name,priority:1"`
	LastName  string `json:"lastname" gorm:"index:idx_name,priority:2"`
	Email     string `json:"email" gorm:"index"`
	Username  string `json:"username" gorm:"unique:index"`
}

type DraftUser struct {
	FirstName string `json:"firstname" gorm:"not null"`
	LastName  string `json:"lastname" gorm:"not null"`
	Email     string `json:"email" gorm:"not null"`
	Username  string `json:"username" gorm:"not null"`
	VerifyID  string `json:"verifyid" gorm:"not null"`
}
