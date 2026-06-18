#!/bin/bash
# Script to start PostgreSQL using local data directory on port 5433
SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
export LC_ALL=C
/opt/homebrew/opt/postgresql@15/bin/pg_ctl -D "$SCRIPT_DIR/asksenior-backend/.postgres_data" -o "-p 5433" -l "$SCRIPT_DIR/asksenior-backend/logfile" start
