#!/usr/bin/env bash
# Start NGROK in background
ngrok http 8080 > /dev/null &

ngrok_pid=$!

echo "${ngrok_pid}"

# # Wait for ngrok to be available
# while ! nc -z localhost 4040; do
#   sleep 1 # wait Ngrok to be available
# done

sleep 3

# Get NGROK dynamic URL from its own exposed local API
NGROK_REMOTE_URL="$(curl http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | sed 's/"public_url":"//')"
echo "${NGROK_REMOTE_URL}"

export ngrok_pid

# if test -z "${NGROK_REMOTE_URL}"
# then
#   echo "❌ ERROR: ngrok doesn't seem to return a valid URL (${NGROK_REMOTE_URL})."
#   exit 1
# fi

# # Trim double quotes from variable
# NGROK_REMOTE_URL=$(echo ${NGROK_REMOTE_URL} | tr -d '"')
# # If http protocol is returned, replace by https
# NGROK_REMOTE_URL=${NGROK_REMOTE_URL/http:\/\//https:\/\/}

# # Get script parent folder to point to .env file and get TELEGRAM_BOT_TOKEN dynamically
# PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" || exit ; pwd -P )

# bold=$(tput bold)
# normal=$(tput sgr0)
# echo ${NGROK_REMOTE_URL} | tr -d '\n' | pbcopy
# printf "\n\n🌍 Your ngrok remote URL is 👉 ${bold}${NGROK_REMOTE_URL} 👈\n📋 ${normal}I've just copied it to your clipboard 😉\n\n"
