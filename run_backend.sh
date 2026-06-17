#!/bin/bash
# Script to run the backend using the local JDK
SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR/asksenior-backend/asksenior"
export JAVA_HOME="$SCRIPT_DIR/asksenior-backend/.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# Load local dev secrets (DO NOT commit .env.local to Git)
ENV_FILE="$SCRIPT_DIR/.env.local"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

./mvnw spring-boot:run
