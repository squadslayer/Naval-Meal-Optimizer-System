import gspread
from faker import Faker
import random
from datetime import datetime, timedelta
import time

# --- CONFIGURATION ---
# The number of sailor records you want to generate
NUM_RECORDS_TO_GENERATE = 5000

# The path to your credentials file
SERVICE_ACCOUNT_FILE = 'credentials.json'

# The name of your Google Sheet
SHEET_NAME = 'Sailor Information Response'


# ---------------------


def generate_sailor_data(faker_instance, existing_ids):
    """Generates a single row of realistic sailor data."""

    # Ensure Sailor ID is unique
    while True:
        sailor_id = f"SLR-{random.randint(1000, 99999)}"
        if sailor_id not in existing_ids:
            existing_ids.add(sailor_id)
            break

    # Generate realistic names and data
    first_name = faker_instance.first_name()
    last_name = faker_instance.last_name()
    full_name = f"{first_name} {last_name}"

    # Generate a random DOB for someone between 20 and 55 years old
    today = datetime.now()
    start_date = today - timedelta(days=55 * 365)
    end_date = today - timedelta(days=20 * 365)
    dob = faker_instance.date_between(start_date=start_date, end_date=end_date).strftime('%d/%m/%Y')

    gender = random.choice(['Male', 'Female'])
    food_preference = random.choice(['Vegetarian', 'Non-Vegetarian'])

    # Generate potential allergies
    allergy_options = ['No allergies', 'Nuts', 'Gluten', 'Dairy', 'Seafood']
    allergies = random.choices(allergy_options, weights=[0.8, 0.05, 0.05, 0.05, 0.05], k=1)[0]

    emergency_contact_name = faker_instance.name()
    # Generate a realistic Indian mobile number
    emergency_contact_number = f"91{faker_instance.msisdn()[3:]}"

    voyage_role = random.choice(['Captain', 'First Mate', 'Engineer', 'Deckhand', 'Chef', 'Medic', 'Crew Member'])

    # The order MUST match the column order in your Google Sheet
    return [
        datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
        full_name,
        sailor_id,
        dob,
        gender,
        food_preference,
        allergies,
        emergency_contact_name,
        emergency_contact_number,
        voyage_role
    ]


def main():
    """Main function to generate data and populate the sheet."""
    print("--- Starting Sailor Data Generation ---")

    # Initialize Faker for Indian names and numbers
    fake = Faker('en_IN')

    print(f"Generating {NUM_RECORDS_TO_GENERATE} records...")
    all_sailor_data = []
    existing_sailor_ids = set()

    for i in range(NUM_RECORDS_TO_GENERATE):
        all_sailor_data.append(generate_sailor_data(fake, existing_sailor_ids))
        if (i + 1) % 1000 == 0:
            print(f"  ... {i + 1} records generated.")

    print("\nConnecting to Google Sheets...")
    try:
        gc = gspread.service_account(filename=SERVICE_ACCOUNT_FILE)
        spreadsheet = gc.open(SHEET_NAME)
        worksheet = spreadsheet.sheet1
    except Exception as e:
        print(f"\n[ERROR] Could not connect to Google Sheets: {e}")
        print("Please check your credentials and sheet name/sharing permissions.")
        return

    print(f"Appending {len(all_sailor_data)} rows to '{SHEET_NAME}'. This may take a moment...")

    # Append all rows in a single API call for efficiency
    worksheet.append_rows(all_sailor_data, value_input_option='USER_ENTERED')

    print("\n--- Success! ---")
    print(f"Your Google Sheet has been populated with {NUM_RECORDS_TO_GENERATE} new records.")


if __name__ == '__main__':
    main()