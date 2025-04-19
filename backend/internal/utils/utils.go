package utils

import (
	// "encoding/json"
	"math/rand/v2"
	"os"
	"strconv"
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

func GenerateRandomBase36String(length int) string {
	// Generate a random number and convert to base36
	num := rand.Int64()
	base36 := strconv.FormatInt(num, 36)
	
	// If the generated string is shorter than requested length,
	// pad with random characters
	for len(base36) < length {
		base36 += string(rune('a' + rand.IntN(26)))
	}
	
	// If the generated string is longer than requested length,
	// truncate it
	if len(base36) > length {
		base36 = base36[:length]
	}
	
	return base36
}
