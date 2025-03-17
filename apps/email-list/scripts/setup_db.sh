#!/bin/bash

DB_USER="root"
DB_NAME="email_list"

# Create database
mysql -u "$DB_USER" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

echo "Database $DB_NAME created successfully"
