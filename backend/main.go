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
	limiter := rate.NewLimiter(100, 10)

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
	corsConfig := cors.New(cors.Config{
		AllowOrigins:     ALLOWED_HOSTS,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization", "Token"},
		ExposeHeaders:    []string{"Origin", "Token", "Authorization"},
		AllowCredentials: true,
	})
	r.Use(corsConfig)

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
			// Get room Lists
			roomRoutes.GET("", roomHandler.GetRoomsList)
			
			// Create Room and invite user in case of private
			roomRoutes.POST("/create", roomHandler.CreateRoom)

			// Delete Room
			roomRoutes.DELETE("/:roomId", roomHandler.DeleteRoom)

			// Leave Room
			roomRoutes.POST("/:roomId/leave", roomHandler.LeaveRoom)

			// Accept Invited Rooms
			roomRoutes.POST("/:roomId/accept", roomHandler.AcceptRoomInvite)

			// Decline Invitation
			roomRoutes.POST("/:roomId/decline", roomHandler.DeclineInvitaion)

			// Request to join room
			roomRoutes.POST("/:roomId/join", roomHandler.RequestToJoin)
			
			// Get Request to joined rooms
			roomRoutes.GET("/:roomId/join-request", roomHandler.GetJoinRequest)

			// Cancel Join Request Room
			roomRoutes.POST("/:roomId/cancel-join", roomHandler.CancelJoinReqest)

			// Cancel invites
			roomRoutes.POST("/:roomId/cancel-invite", roomHandler.CancelInvite)
		}

		messageRoutes := protectedRoutes.Group("/messages")
		{
			// Send Messages
			messageRoutes.POST("/:roomId", roomHandler.SendMessage)
			
			// Get Messages
			messageRoutes.GET("/:roomId", roomHandler.FetchMessageByRoomId)
			
			// Delete message
			messageRoutes.DELETE("/:roomId/:messageId", roomHandler.DeleteMessage)

			// Edit message
			messageRoutes.PUT("/:roomId/:messageId", roomHandler.EditMessage)
		}
	}

	r.Run(":" + PORT)
}
