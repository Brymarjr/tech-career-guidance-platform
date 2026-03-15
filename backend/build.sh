#!/usr/bin/env bash
set -o errexit

echo "--- Installing Dependencies ---"
pip install -r requirements.txt

echo "--- Running Database Migrations ---"
python manage.py migrate --no-input

echo "--- Creating Primary Admin ---"
# We wrap this in a try-except or check inside the command as we did before
python manage.py create_admin

echo "--- Seeding Production Data ---"
# Only run this if you've fixed the 'trait_code' field name above
python manage.py seed_data

echo "--- Collecting Static Files ---"
python manage.py collectstatic --no-input