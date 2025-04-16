package config

import (
	"context"

	"github.com/redis/go-redis/v9"
)

func NewRedisClient(cfg Config) *redis.Client {
	client := redis.NewClient(&redis.Options{
		Addr: cfg.REDIS_ADDR,
		Password: cfg.REDIS_PASS,
		DB: 0,
	})

	ctx := context.Background()
	_, err := client.Ping(ctx).Result()
	if err != nil {
		panic("Failed to connect to Redis: " + err.Error())
	}

	return client
}
