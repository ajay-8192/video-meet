package main

import (
	"net/http"
	"video-chat/internal/auth"
	"video-chat/internal/config"
	"video-chat/internal/database"
	"video-chat/internal/room"
	"video-chat/internal/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/time/rate"
)

func main() {
	godotenv.Load()
	PORT := utils.GetEnvOrDefaultValue("PORT", "8080")

	// Load config
	cfg := config.LoadConfig()

	// Init databases
	db := database.InitMySQL(cfg)

	// Connect to Redis Client
	redisClient := config.NewRedisClient(*cfg)

	// Initialize Services
	authService := auth.NewAuthServer(db)
	roomService := room.NewRoomService(db)

	// Initialize handler
	authHandler := auth.NewAuthHandler(authService, redisClient)
	roomHandler := room.NewRoomHandler(roomService, redisClient)

	r := gin.Default()

	// Add rate limiter
	limiter := rate.NewLimiter(35, 10)

	// Rate Limiter of 5sec with 10 request max
	r.Use(func(ctx *gin.Context) {
		if !limiter.Allow() {
			ctx.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Try again later.",
			})
			ctx.Abort()
			return
		}
		ctx.Next()
	})

	var ALLOWED_HOSTS []string = []string{"http://localhost:4173", "http://localhost:5173", "http://localhost:3000"}
	config := cors.New(cors.Config{
		AllowOrigins:     ALLOWED_HOSTS,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization", "Token"},
		ExposeHeaders:    []string{"Origin", "Token", "Authorization"},
		AllowCredentials: true,
	})
	r.Use(config)

	r.GET("/health-status", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Auth routes
	r.POST("/api/register", authHandler.Register)
	r.POST("/api/send-otp", authHandler.SendOTP)
	r.POST("/api/verify-account", authHandler.VerifyAccount)
	r.POST("/api/verify-otp", authHandler.VerifyOTP)

	protectedRoutes := r.Group("/api")
	protectedRoutes.Use(authHandler.AuthMiddleware(redisClient))
	{
		protectedRoutes.POST("/delete-account", authHandler.DeleteAccount)
		protectedRoutes.GET("/user", authHandler.ProfileDetails)

		roomRoutes := protectedRoutes.Group("/rooms")
		{
			// Get Rooms
			roomRoutes.GET("", roomHandler.ListRooms)
			
			// Create Room
			roomRoutes.POST("/create", roomHandler.CreateRoom)

			// Get Room Details
			roomRoutes.GET("/:id", roomHandler.GetRoom)

			// Update Room Details
			roomRoutes.POST("/:id", roomHandler.UpdateRoom)

			// Delete Room in case if user is admin
			roomRoutes.POST("/:id/delete", roomHandler.DeleteRoom)

			// Leave already joined Room
			roomRoutes.GET("/:id/leave", roomHandler.LeaveRoom)
			
			// Cancel Join request
			roomRoutes.POST("/:id/join/cancel", roomHandler.CancelRequest)

			// Join Room Request
			roomRoutes.POST("/:id/join/request", roomHandler.JoinRoomRequest)

			// Join Room
			roomRoutes.POST("/:id/join", roomHandler.JoinRoom)

			// Cancel Invitation
			roomRoutes.POST("/:id/invite/cancel", roomHandler.CancelInvite)

			// Invite users to group
			roomRoutes.POST("/:id/invite", roomHandler.InviteRoom)
			// roomRoutes.PUT("/:id", roomHandler.UpdateRoomSettings)
			// roomRoutes.PATCH("/:id/status", roomHandler.UpdateRoomStatus)
		}
	}

	r.Run(":" + PORT)
}
