package config

import "video-chat/internal/utils"

type Config struct {
	DB_HOST     string
	DB_PORT     string
	DB_USER     string
	DB_PASSWORD string
	DB_NAME     string
	DB_SSLMODE  string

	REDIS_ADDR string
	REDIS_PASS string
	REDIS_DB   string
}

func LoadConfig() *Config {
	return &Config{
		DB_HOST:     utils.GetEnvOrDefaultValue("DB_HOST", "localhost"),
		DB_PORT:     utils.GetEnvOrDefaultValue("DB_PORT", "5432"),
		DB_USER:     utils.GetEnvOrDefaultValue("DB_USER", ""),
		DB_PASSWORD: utils.GetEnvOrDefaultValue("DB_PASSWORD", ""),
		DB_NAME:     utils.GetEnvOrDefaultValue("DB_NAME", ""),
		DB_SSLMODE:  utils.GetEnvOrDefaultValue("DB_SSLMODE", ""),

		REDIS_ADDR: utils.GetEnvOrDefaultValue("REDIS_ADDR", ""),
		REDIS_PASS: utils.GetEnvOrDefaultValue("REDIS_PASS", ""),
		REDIS_DB:   utils.GetEnvOrDefaultValue("REDIS_DB", ""),
	}
}
