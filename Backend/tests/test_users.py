import asyncio
import sys
import os
from datetime import datetime
import json

# Add the parent directory to Python path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from app.models.user import UserRole, UserStatus

class UserAPITester:
    def __init__(self, base_url: str = "http://localhost:8000/api/v1"):
        self.base_url = base_url
        self.created_users = []  # Keep track of created users for cleanup
        
    def print_test_header(self, test_name: str):
        """Print formatted test header"""
        print(f"\n{'='*60}")
        print(f"🧪 {test_name}")
        print(f"{'='*60}")
        
    def print_result(self, success: bool, message: str, details: dict = None):
        """Print formatted test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)}")
        
    def test_create_user(self):
        """Test POST /api/v1/users/"""
        self.print_test_header("Testing User Creation")
        
        # Test valid user creation
        test_users = [
            {
                "name": "Dr. Test User",
                "email": "test.user@hospital.com",
                "role": UserRole.CLINICIAN.value,
                "password": "password123"
            },
            {
                "name": "Admin Test User",
                "email": "admin.test@hospital.com", 
                "role": UserRole.ADMIN.value,
                "password": "adminpass123"
            },
            {
                "name": "System Test User",
                "email": "system.test@hospital.com",
                "role": UserRole.SYSTEM.value,
                "password": "systempass123"
            }
        ]
        
        for i, user_data in enumerate(test_users, 1):
            try:
                response = requests.post(f"{self.base_url}/users/", json=user_data)
                
                if response.status_code == 201:
                    result = response.json()
                    self.created_users.append(result["id"])
                    self.print_result(True, f"User {i} created successfully", {
                        "user_id": result["id"],
                        "name": result["name"],
                        "role": result["role"]
                    })
                else:
                    self.print_result(False, f"Failed to create user {i}", {
                        "status_code": response.status_code,
                        "response": response.text
                    })
                    
            except Exception as e:
                self.print_result(False, f"Exception creating user {i}: {str(e)}")
        
        # Test duplicate email
        try:
            duplicate_user = {
                "name": "Duplicate User",
                "email": "test.user@hospital.com",  # Same as first user
                "role": UserRole.CLINICIAN.value,
                "password": "password123"
            }
            response = requests.post(f"{self.base_url}/users/", json=duplicate_user)
            
            if response.status_code == 409:
                self.print_result(True, "Duplicate email correctly rejected")
            else:
                self.print_result(False, "Duplicate email not properly handled", {
                    "status_code": response.status_code,
                    "response": response.text
                })
        except Exception as e:
            self.print_result(False, f"Exception testing duplicate email: {str(e)}")
            
        # Test invalid data
        invalid_users = [
            {"name": "", "email": "invalid@test.com", "role": "clinician", "password": "123"},
            {"name": "Test", "email": "invalid-email", "role": "clinician", "password": "123456"},
            {"name": "Test", "email": "test@test.com", "role": "invalid_role", "password": "123456"}
        ]
        
        for i, invalid_user in enumerate(invalid_users, 1):
            try:
                response = requests.post(f"{self.base_url}/users/", json=invalid_user)
                if response.status_code in [400, 422]:
                    self.print_result(True, f"Invalid data {i} correctly rejected")
                else:
                    self.print_result(False, f"Invalid data {i} not properly validated", {
                        "status_code": response.status_code,
                        "data": invalid_user
                    })
            except Exception as e:
                self.print_result(False, f"Exception testing invalid data {i}: {str(e)}")

    def test_get_users(self):
        """Test GET /api/v1/users/"""
        self.print_test_header("Testing Get Users")
        
        try:
            # Test basic get all users
            response = requests.get(f"{self.base_url}/users/")
            if response.status_code == 200:
                users = response.json()
                self.print_result(True, f"Retrieved {len(users)} users")
            else:
                self.print_result(False, "Failed to get users", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                
            # Test pagination
            response = requests.get(f"{self.base_url}/users/?skip=0&limit=2")
            if response.status_code == 200:
                users = response.json()
                self.print_result(True, f"Pagination works - got {len(users)} users with limit=2")
            else:
                self.print_result(False, "Pagination failed")
                
            # Test role filtering
            response = requests.get(f"{self.base_url}/users/?role=clinician")
            if response.status_code == 200:
                users = response.json()
                clinicians = [u for u in users if u["role"] == "clinician"]
                self.print_result(True, f"Role filtering works - found {len(clinicians)} clinicians")
            else:
                self.print_result(False, "Role filtering failed")
                
            # Test search
            response = requests.get(f"{self.base_url}/users/?search=test")
            if response.status_code == 200:
                users = response.json()
                self.print_result(True, f"Search works - found {len(users)} users with 'test'")
            else:
                self.print_result(False, "Search failed")
                
        except Exception as e:
            self.print_result(False, f"Exception testing get users: {str(e)}")

    def test_get_user_by_id(self):
        """Test GET /api/v1/users/{user_id}"""
        self.print_test_header("Testing Get User by ID")
        
        if not self.created_users:
            self.print_result(False, "No users available for testing")
            return
            
        try:
            # Test valid user ID
            user_id = self.created_users[0]
            response = requests.get(f"{self.base_url}/users/{user_id}")
            
            if response.status_code == 200:
                user = response.json()
                self.print_result(True, "Retrieved user by ID", {
                    "user_id": user["id"],
                    "name": user["name"],
                    "email": user["email"]
                })
            else:
                self.print_result(False, "Failed to get user by ID", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                
            # Test invalid user ID
            response = requests.get(f"{self.base_url}/users/invalid_id_123")
            if response.status_code == 404:
                self.print_result(True, "Invalid user ID correctly returns 404")
            else:
                self.print_result(False, "Invalid user ID not properly handled")
                
        except Exception as e:
            self.print_result(False, f"Exception testing get user by ID: {str(e)}")

    def test_update_user(self):
        """Test PUT /api/v1/users/{user_id}"""
        self.print_test_header("Testing Update User")
        
        if not self.created_users:
            self.print_result(False, "No users available for testing")
            return
            
        try:
            user_id = self.created_users[0]
            
            # Test valid update
            update_data = {
                "name": "Updated Test User",
                "status": UserStatus.INACTIVE.value
            }
            
            response = requests.put(f"{self.base_url}/users/{user_id}", json=update_data)
            
            if response.status_code == 200:
                updated_user = response.json()
                self.print_result(True, "User updated successfully", {
                    "updated_name": updated_user["name"],
                    "updated_status": updated_user["status"]
                })
            else:
                self.print_result(False, "Failed to update user", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                
            # Test invalid user ID
            response = requests.put(f"{self.base_url}/users/invalid_id_123", json=update_data)
            if response.status_code == 404:
                self.print_result(True, "Update with invalid ID correctly returns 404")
            else:
                self.print_result(False, "Update with invalid ID not properly handled")
                
            # Test empty update
            response = requests.put(f"{self.base_url}/users/{user_id}", json={})
            if response.status_code == 400:
                self.print_result(True, "Empty update correctly rejected")
            else:
                self.print_result(False, "Empty update not properly handled")
                
        except Exception as e:
            self.print_result(False, f"Exception testing update user: {str(e)}")

    def test_delete_user(self):
        """Test DELETE /api/v1/users/{user_id}"""
        self.print_test_header("Testing Delete User")
        
        if not self.created_users:
            self.print_result(False, "No users available for testing")
            return
            
        try:
            # Test valid deletion (delete last user to keep others for other tests)
            user_id = self.created_users[-1] if len(self.created_users) > 1 else self.created_users[0]
            
            response = requests.delete(f"{self.base_url}/users/{user_id}")
            
            if response.status_code == 200:
                result = response.json()
                self.print_result(True, "User deleted successfully", {
                    "message": result["message"],
                    "deleted_user_id": result["deleted_user_id"]
                })
                self.created_users.remove(user_id)
            else:
                self.print_result(False, "Failed to delete user", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                
            # Test invalid user ID
            response = requests.delete(f"{self.base_url}/users/invalid_id_123")
            if response.status_code == 404:
                self.print_result(True, "Delete with invalid ID correctly returns 404")
            else:
                self.print_result(False, "Delete with invalid ID not properly handled")
                
        except Exception as e:
            self.print_result(False, f"Exception testing delete user: {str(e)}")

    def test_get_user_profile(self):
        """Test GET /api/v1/users/{user_id}/profile"""
        self.print_test_header("Testing Get User Profile")
        
        if not self.created_users:
            self.print_result(False, "No users available for testing")
            return
            
        try:
            user_id = self.created_users[0]
            response = requests.get(f"{self.base_url}/users/{user_id}/profile")
            
            if response.status_code == 200:
                profile = response.json()
                self.print_result(True, "Retrieved user profile", {
                    "user_id": profile["id"],
                    "name": profile["name"],
                    "role": profile["role"]
                })
            else:
                self.print_result(False, "Failed to get user profile", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                
        except Exception as e:
            self.print_result(False, f"Exception testing get user profile: {str(e)}")

    def test_additional_endpoints(self):
        """Test additional utility endpoints"""
        self.print_test_header("Testing Additional Endpoints")
        
        try:
            # Test roles endpoint
            response = requests.get(f"{self.base_url}/users/roles/available")
            if response.status_code == 200:
                roles = response.json()
                self.print_result(True, f"Retrieved {len(roles['roles'])} available roles")
            else:
                self.print_result(False, "Failed to get available roles")
                
            # Test statuses endpoint
            response = requests.get(f"{self.base_url}/users/statuses/available")
            if response.status_code == 200:
                statuses = response.json()
                self.print_result(True, f"Retrieved {len(statuses['statuses'])} available statuses")
            else:
                self.print_result(False, "Failed to get available statuses")
                
        except Exception as e:
            self.print_result(False, f"Exception testing additional endpoints: {str(e)}")

    def cleanup(self):
        """Clean up created test data"""
        self.print_test_header("Cleaning Up Test Data")
        
        for user_id in self.created_users.copy():
            try:
                response = requests.delete(f"{self.base_url}/users/{user_id}")
                if response.status_code == 200:
                    self.print_result(True, f"Cleaned up user: {user_id}")
                    self.created_users.remove(user_id)
                else:
                    self.print_result(False, f"Failed to cleanup user: {user_id}")
            except Exception as e:
                self.print_result(False, f"Exception cleaning up user {user_id}: {str(e)}")

    def run_all_tests(self):
        """Run all user API tests"""
        print(f"\n🚀 Starting User API Tests")
        print(f"Base URL: {self.base_url}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        
        try:
            # Test server connectivity
            response = requests.get(f"{self.base_url}/docs")
            if response.status_code != 200:
                print(f"❌ Server not accessible at {self.base_url}")
                return
                
            self.test_create_user()
            self.test_get_users()
            self.test_get_user_by_id()
            self.test_update_user()
            self.test_get_user_profile()
            self.test_additional_endpoints()
            self.test_delete_user()  # Run delete last to preserve test data
            
        except Exception as e:
            print(f"❌ Fatal error during testing: {str(e)}")
        finally:
            self.cleanup()
            
        print(f"\n{'='*60}")
        print("🏁 User API Testing Complete")
        print(f"{'='*60}")

def main():
    """Main function to run user API tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test User API endpoints")
    parser.add_argument(
        "--url", 
        default="http://localhost:8000", 
        help="Base URL for the API (default: http://localhost:8000)"
    )
    
    args = parser.parse_args()
    
    tester = UserAPITester(args.url)
    tester.run_all_tests()

if __name__ == "__main__":
    main()
