package utils

import (
	// "encoding/json"
	"math/rand/v2"
	"os"
)

func GetEnvOrDefaultValue(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return defaultValue
}

func GenerateOTP() string {
	otp := ""
	for i := 0; i < 6; i++ {
		otp += string(rune('0' + rand.IntN(10)))
	}
	return otp
}
