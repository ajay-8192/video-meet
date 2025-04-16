package auth

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func (h *AuthHandler) AuthMiddleware(client *redis.Client) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		token, err := ctx.Cookie("token")
		if err != nil {
			fmt.Printf("Auth failed: no token cookie found - %v", err)
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not logged in"})
			ctx.Abort()
			return
		}

		data, err := client.Get(ctx.Request.Context(), token).Result()
		if err != nil {
			fmt.Printf("Auth failed: invalid token - %v", err)
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			ctx.Abort()
			return
		}

		var userID string
		if err := json.Unmarshal([]byte(data), &userID); err != nil {
			fmt.Printf("Auth failed: error unmarshaling userID - %v", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			ctx.Abort()
			return
		}

		fmt.Printf("Auth successful for user: %s", userID)
		ctx.Set("userId", userID)
		ctx.Next()
	}
}
