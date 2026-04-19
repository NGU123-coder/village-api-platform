import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def ingest_data(file_path):
    print(f"Starting ingestion from {file_path}...")
    df = pd.read_csv(file_path)
    
    # Connect to DB
    # Strip ?schema=... from URL for psycopg2 compatibility
    dsn = DATABASE_URL.split("?")[0]
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        # 1. Ingest Country (Assume India for now)
        cur.execute("INSERT INTO \"Country\" (name, code) VALUES (%s, %s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id", ("India", "IN"))
        country_id = cur.fetchone()[0]
        
        # 2. Ingest States
        states = df['State'].unique()
        state_map = {}
        for state in states:
            cur.execute("INSERT INTO \"State\" (name, code, \"countryId\") VALUES (%s, %s, %s) ON CONFLICT (name, \"countryId\") DO UPDATE SET name=EXCLUDED.name RETURNING id", (state, state[:2].upper(), country_id))
            state_map[state] = cur.fetchone()[0]
            
        # 3. Ingest Districts
        districts = df[['District', 'State']].drop_duplicates()
        district_map = {}
        for index, row in districts.iterrows():
            state_id = state_map[row['State']]
            cur.execute("INSERT INTO \"District\" (name, \"stateId\") VALUES (%s, %s) ON CONFLICT (name, \"stateId\") DO UPDATE SET name=EXCLUDED.name RETURNING id", (row['District'], state_id))
            district_map[(row['District'], state_id)] = cur.fetchone()[0]
            
        # 4. Ingest SubDistricts
        sub_districts = df[['SubDistrict', 'District', 'State']].drop_duplicates()
        sub_district_map = {}
        for index, row in sub_districts.iterrows():
            state_id = state_map[row['State']]
            district_id = district_map[(row['District'], state_id)]
            cur.execute("INSERT INTO \"SubDistrict\" (name, \"districtId\") VALUES (%s, %s) ON CONFLICT (name, \"districtId\") DO UPDATE SET name=EXCLUDED.name RETURNING id", (row['SubDistrict'], district_id))
            sub_district_map[(row['SubDistrict'], district_id)] = cur.fetchone()[0]
            
        # 5. Ingest Villages
        for index, row in df.iterrows():
            state_id = state_map[row['State']]
            district_id = district_map[(row['District'], state_id)]
            sub_district_id = sub_district_map[(row['SubDistrict'], district_id)]
            
            cur.execute("INSERT INTO \"Village\" (name, \"subDistrictId\", \"pinCode\", population) VALUES (%s, %s, %s, %s) ON CONFLICT (name, \"subDistrictId\") DO NOTHING", (row['Village'], sub_district_id, str(row['PinCode']), int(row['Population'])))
            
        conn.commit()
        print("Ingestion completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error during ingestion: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    # Example usage: python ingest.py data/sample.csv
    import sys
    if len(sys.argv) > 1:
        ingest_data(sys.argv[1])
    else:
        print("Please provide a path to a CSV file.")
