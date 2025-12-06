import gspread
from django.core.management.base import BaseCommand
from django.db import transaction
from meal_planning.models import User, SailorProfile
import os

SERVICE_ACCOUNT_FILE = 'credentials.json'
SHEET_NAME = 'Sailor Information Response'

class Command(BaseCommand):
    help = 'Seeds the database with Sailor information from a Google Sheet.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Connecting to Google Sheets...')
        try:
            gc = gspread.service_account(filename=SERVICE_ACCOUNT_FILE)
            spreadsheet = gc.open(SHEET_NAME)
            worksheet = spreadsheet.sheet1
            records = worksheet.get_all_records()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to connect to Google Sheets: {e}'))
            return

        self.stdout.write('Clearing existing sailor data...')
        User.objects.filter(role='sailor').delete()

        self.stdout.write(f'Found {len(records)} records. Seeding new sailors from Google Sheet...')
        for record in records:
            full_name = record.get('Full Name')
            sailor_id = record.get('Sailor/Employee ID')
            food_pref = record.get('Food Preference', '').lower()
            allergies = record.get('Allergies', '').lower()

            if not sailor_id:
                self.stdout.write(self.style.WARNING(f'Skipping row with missing Sailor ID: {record}'))
                continue

            try:
                user = User.objects.create_user(
                    username=sailor_id.strip(),
                    first_name=full_name.split()[0] if full_name else '',
                    last_name=' '.join(full_name.split()[1:]) if full_name and ' ' in full_name else '',
                    password=os.environ.get('DEFAULT_SAILOR_PASSWORD', 'password123'),
                    role='sailor'
                )

                profile = user.sailorprofile

                if 'non' in food_pref:
                    profile.preference_type = 'non_veg'
                elif 'veg' in food_pref:
                    profile.preference_type = 'veg'

                if 'gluten' in allergies:
                    profile.has_gluten_allergy = True
                if 'nut' in allergies:
                    profile.has_nut_allergy = True
                if 'dairy' in allergies:
                    profile.has_dairy_allergy = True

                profile.save()

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Could not create user for '{full_name}'. Error: {e}"))

        self.stdout.write(self.style.SUCCESS('Database seeding of sailors from Google Sheet complete.'))