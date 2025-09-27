import requests
import json

def test_endpoints():
    """Test the main API endpoints to verify fixes"""
    base_url = "http://127.0.0.1:8000"
    
    endpoints = [
        "/health",
        "/status", 
        "/dashboard/metrics",
        "/"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            data = response.json()
            print(f"✅ {endpoint}: {response.status_code}")
            if response.status_code != 200:
                print(f"   Error: {data}")
            else:
                print(f"   Success: {json.dumps(data, indent=2)[:200]}...")
            print()
        except Exception as e:
            print(f"❌ {endpoint}: Connection error - {e}")
            print()

if __name__ == "__main__":
    test_endpoints()