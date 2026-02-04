#!/bin/bash

echo "Checking services status..."
echo "=========================="

# Check if api-server is running on port 3000
if curl -s http://localhost:3000/api > /dev/null; then
    echo "✅ api-server is running on http://localhost:3000"
else
    echo "❌ api-server is NOT running on port 3000"
fi

# Check if api-service is running on port 8000
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ api-service is running on http://localhost:8000"
    
    # Test the chat endpoint
    echo "Testing /chat endpoint..."
    RESPONSE=$(curl -s -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d '{"message": "hello"}')
    if echo "$RESPONSE" | grep -q "response"; then
        echo "✅ Chat endpoint is working"
        echo "   Response: $(echo "$RESPONSE" | jq -r '.response')"
    else
        echo "❌ Chat endpoint is NOT working"
    fi
    
else
    echo "❌ api-service is NOT running on port 8000"
fi

echo "=========================="
