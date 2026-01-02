package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// Global Supabase configuration
var supabaseURL string
var supabaseKey string

// InitSupabase initializes the Supabase configuration
func InitSupabase() error {
	supabaseURL = os.Getenv("NEXT_PUBLIC_SUPABASE_URL")
	if supabaseURL == "" {
		supabaseURL = os.Getenv("SUPABASE_URL")
	}
	supabaseKey = os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if supabaseKey == "" {
		supabaseKey = os.Getenv("SUPABASE_SECRET_KEY")
	}

	if supabaseURL == "" || supabaseKey == "" {
		return errors.New("supabase configuration missing: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
	}
	return nil
}

// SupabaseRequest performs a generic request to the Supabase REST API
func SupabaseRequest(method, table string, query map[string]string, body interface{}) ([]byte, error) {
	url := fmt.Sprintf("%s/rest/v1/%s", supabaseURL, table)

	// Build query string
	if len(query) > 0 {
		params := []string{}
		for k, v := range query {
			params = append(params, fmt.Sprintf("%s=%s", k, v))
		}
		url += "?" + strings.Join(params, "&")
	}

	var reqBody io.Reader
	if body != nil {
		jsonBody, _ := json.Marshal(body)
		reqBody = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", supabaseKey)
	req.Header.Set("Authorization", "Bearer "+supabaseKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

// SupabaseSelect performs a SELECT query
func SupabaseSelect(table string, query map[string]string) ([]map[string]interface{}, error) {
	if query == nil {
		query = map[string]string{}
	}
	query["select"] = "*"

	data, err := SupabaseRequest("GET", table, query, nil)
	if err != nil {
		return nil, err
	}

	var result []map[string]interface{}
	err = json.Unmarshal(data, &result)
	return result, err
}

// SupabaseInsert performs an INSERT operation
func SupabaseInsert(table string, data interface{}) ([]map[string]interface{}, error) {
	respData, err := SupabaseRequest("POST", table, nil, data)
	if err != nil {
		return nil, err
	}

	var result []map[string]interface{}
	err = json.Unmarshal(respData, &result)
	return result, err
}

// SupabaseUpdate performs an UPDATE operation
func SupabaseUpdate(table string, query map[string]string, data interface{}) error {
	_, err := SupabaseRequest("PATCH", table, query, data)
	return err
}

// SupabaseDelete performs a DELETE operation
func SupabaseDelete(table string, query map[string]string) error {
	_, err := SupabaseRequest("DELETE", table, query, nil)
	return err
}
