"""
Simple runner script for data ingestion.
Run this from the BioSage-Backend directory: python run_data_ingestion.py
"""
import asyncio
import os
import sys

# Ensure we can import from the scripts directory
sys.path.append(os.path.join(os.path.dirname(__file__), 'scripts'))

from scripts.ingest_dummy_data import main

if __name__ == "__main__":
    print("🚀 Starting BioSage dummy data ingestion...")
    print("Make sure MongoDB is running and the application database is accessible.")
    print("-" * 60)
    
    try:
        asyncio.run(main())
        print("\n" + "=" * 60)
        print("✅ Data ingestion completed! Your BioSage database is now populated with dummy data.")
        print("You can now test the API endpoints with realistic medical data.")
    except KeyboardInterrupt:
        print("\n❌ Data ingestion interrupted by user.")
    except Exception as e:
        print(f"\n❌ Data ingestion failed: {str(e)}")
        print("Please check your database connection and try again.")
