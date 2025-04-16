package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"video-chat/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type AuthHandler struct {
	server *AuthServer
	redisClient *redis.Client
	ctx context.Context
}

func NewAuthHandler(server *AuthServer, redisClient *redis.Client) *AuthHandler {
	return &AuthHandler{
		server: server,
		redisClient: redisClient,
		ctx: context.Background(),
	}
}

type RegisterRequest struct {
	FirstName string `json:"firstname" binding:"required,min=4"`
	LastName  string `json:"lastname"`
	Email     string `json:"email" binding:"required,email"`
	Username  string `json:"username" binding:"required,min=5"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("Invalid registration request: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	_, err := h.server.GetUser(req.Email, req.Username)
	if err == nil {
		fmt.Printf("Registration failed: User already exists with email %s\n", req.Email)
		c.JSON(http.StatusBadRequest, gin.H{"error": "User already exists"})
		return
	} else if err != gorm.ErrRecordNotFound {
		fmt.Printf("Registration error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	// Check if there's a pending draft registration
	draftUser, err := h.server.GetDraftUser(req.Email, req.Username)
	if err == nil {
		// Draft user exists, resend verification link
		link := fmt.Sprintf("%s/verify-account?email=%s&verifyId=%s",
			utils.GetEnvOrDefaultValue("UI_HOST", "localhost:3000"), draftUser.Email, draftUser.VerifyID)
		
		// TODO: Send verification email with link
		fmt.Printf("Resending verification link to %s: %s\n", draftUser.Email, link)
		
		c.JSON(http.StatusOK, gin.H{
			"message": "Verification link resent to email",
		})
		return
	} else if err != gorm.ErrRecordNotFound {
		fmt.Printf("Error checking draft user: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create new draft user with verification ID
	verifyId := uuid.New().String()
	newDraftUser, err := h.server.CreateDraftUser(req.FirstName, req.LastName, req.Email, req.Username, verifyId)
	if err != nil {
		fmt.Printf("Error creating draft user: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	link := fmt.Sprintf("%s/verify-account?email=%s&verifyId=%s",
		utils.GetEnvOrDefaultValue("UI_HOST", "localhost:3000"), newDraftUser.Email, newDraftUser.VerifyID)
	
	// TODO: Send verification email with link
	fmt.Printf("Sending verification link to %s: %s\n", newDraftUser.Email, link)

	c.JSON(http.StatusOK, gin.H{
		"message": "Verification link sent to email",
	})
}

// Send OTP handler
type SendOTPRequest struct {
	Email string `json:"email" binding:"required"`
}

func (h *AuthHandler) SendOTP(ctx *gin.Context) {
	var req SendOTPRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		fmt.Printf("Invalid OTP request: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	user, err := h.server.GetUser(req.Email, req.Email)
	if err != nil {
		fmt.Printf("User not found for OTP: %s\n", req.Email)
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	
	otp := utils.GenerateOTP()
	otpData, _ := json.Marshal(otp)

	// Store otp in redis for 1hour
	key := fmt.Sprintf("otp-%s", user.ID)
	if err := h.redisClient.Set(h.ctx, key, otpData, time.Hour).Err(); err != nil {
		fmt.Printf("Failed to store OTP in Redis: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create OTP"})
		return
	}

	// TODO: send OTP to user via email
	fmt.Printf("Generated OTP for user %s: %s\n", user.Email, otp)

	ctx.JSON(http.StatusOK, gin.H{
		"message": "OTP sent to mail",
	})
}

// Verify Account Handler
type VerifyAccountRequest struct {
	VerifyID string `json:"verifyId" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
}

func (h *AuthHandler) VerifyAccount(ctx *gin.Context) {
	var req VerifyAccountRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		fmt.Printf("Invalid verification request: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// check whether user already exists in users table
	existedUser, err := h.server.GetUser(req.Email, req.Email)
	if err == nil {
		if existedUser.ID != "" {
			fmt.Printf("Account verification failed: User already exists with email %s\n", req.Email)
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User already exists"})
			return
		}
	} else if err != gorm.ErrRecordNotFound {
		fmt.Printf("Error checking existing user: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// verify account mapping email with verify ID in draftUser
	draftUser, err := h.server.GetDraftUser(req.Email, req.Email)
	if err != nil {
		fmt.Printf("Invalid draft user for verification: %s\n", req.Email)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user"})
		return
	}

	if draftUser.VerifyID != req.VerifyID {
		fmt.Printf("Invalid verification link for user %s\n", req.Email)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid link"})
		return
	}

	// If success create user and remove from draft user
	user, err := h.server.CreateUser(draftUser, uuid.New().String())
	if err != nil {
		fmt.Printf("Error creating user during verification: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user"})
		return
	}

	if err := h.server.RemoveDraftUser(draftUser); err != nil {
		fmt.Printf("Error removing draft user: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting user"})
		return
	}

	fmt.Printf("Successfully verified account for user %s\n", user.Email)
	ctx.JSON(http.StatusOK, gin.H{
		"message": "User account confirmed successfully",
		"user": gin.H{
			"firstname": user.FirstName,
			"lastname": user.LastName,
			"id": user.ID,
			"username": user.Username,
			"email": user.Email,
		},
	})
}

// Verify OTP for login
type VerifyOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
	Otp string 	`json:"otp" binding:"required"`
}

func (h *AuthHandler) VerifyOTP(ctx *gin.Context) {
	var req VerifyOTPRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		fmt.Printf("Invalid OTP verification request: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.server.GetUser(req.Email, req.Email)
	if err != nil {
		fmt.Printf("User not found for OTP verification: %s\n", req.Email)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "User doesnot exist"})
		return
	}

	key := fmt.Sprintf("otp-%s", user.ID)
	data, err := h.redisClient.Get(h.ctx, key).Result()
	if err != nil {
		fmt.Printf("Failed to get OTP from Redis for user %s: %v\n", user.Email, err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "User doesnot exist"})
		return
	}

	var otpData string
	json.Unmarshal([]byte(data), &otpData)

	fmt.Println(otpData, otpData)

	if otpData != req.Otp {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid OTP"})
		return
	}

	token := uuid.NewString()
	tokenData, _ := json.Marshal(user.ID)
	if err := h.redisClient.Set(h.ctx, token, tokenData, 24*7*time.Hour).Err(); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}
	ctx.SetCookie("token", token, int((24 * 7 * time.Hour).Seconds()), "/", "", false, true)

	ctx.JSON(http.StatusOK, gin.H{
		"message": "User account confirmed successfully",
		"user": gin.H{
			"firstname": user.FirstName,
			"lastname": user.LastName,
			"id": user.ID,
			"email": user.Email,
			"username": user.Username,
		},
	})
}

// Get Profile Details
func (h *AuthHandler) ProfileDetails(ctx *gin.Context) {
	userId := ctx.GetString("userId")

	user, err := h.server.GetUserByID(userId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching details"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "User fetched successfully",
		"user": gin.H{
			"firstname": user.FirstName,
			"lastname": user.LastName,
			"id": user.ID,
			"email": user.Email,
			"username": user.Username,
		},
	})
}

// Delete account
func (h *AuthHandler) DeleteAccount(ctx *gin.Context) {
	userId := ctx.GetString("userId")

	// Get user details first to verify they exist
	user, err := h.server.GetUserByID(userId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching user details"})
		return
	}

	// Delete user from database
	if err := h.server.DeleteUser(user); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account"})
		return
	}

	// Clear the auth cookie
	ctx.SetCookie("token", "", -1, "/", "", false, true)

	// Delete session from Redis
	token, _ := ctx.Cookie("token")
	if err := h.redisClient.Del(h.ctx, token).Err(); err != nil {
		// Log error but continue since user is already deleted
		fmt.Printf("Error deleting session: %v\n", err)
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Account deleted successfully",
	})

}