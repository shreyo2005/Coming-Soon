#!/bin/bash
/opt/homebrew/opt/postgresql@15/bin/pg_ctl -D "$(dirname "$0")/asksenior-backend/.postgres_data" stop
