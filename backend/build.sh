#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- Installing Dependencies ---"
pip install -r requirements.txt

echo "--- Running Database Migrations ---"
python manage.py migrate

echo "--- Creating Primary Admin ---"
python manage.py create_admin

echo "--- Seeding Production Data ---"
python manage.py seed_data

echo "--- Collecting Static Files ---"
python manage.py collectstatic --no-input

echo "--- Build Process Complete ---"